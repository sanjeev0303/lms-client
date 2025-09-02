"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useCreatePaymentOrder, useCurrentUser, useVerifyPayment } from "@/hooks";
import {
    initializeBrowserFixes,
    suppressPaymentGatewayErrors,
} from "@/utils/browser-fixes";
import {
    addRazorpayScriptWithCSP,
    checkBrowserCompatibility,
    handlePaymentErrors,
    loadRazorpayScript,
} from "@/utils/payment-errors";
import { useQueryClient } from "@tanstack/react-query";
import {
    AlertTriangle,
    Banknote,
    CreditCard,
    Loader2,
    QrCode,
    Smartphone,
    Wallet,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: string;
    title: string;
    price: number;
    thumbnail?: string;
  };
  onSuccess?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentModal = ({
  isOpen,
  onClose,
  course,
  onSuccess,
}: PaymentModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [browserIssues, setBrowserIssues] = useState<string[]>([]);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const { data: currentUser } = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const createOrderMutation = useCreatePaymentOrder();
  const verifyPaymentMutation = useVerifyPayment();

  // Check browser compatibility and initialize fixes on mount
  useEffect(() => {
    if (isOpen) {
      const issues = checkBrowserCompatibility();
      setBrowserIssues(issues);

      // Initialize browser fixes for SVG errors and console cleanup
      const cleanupBrowserFixes = initializeBrowserFixes();
      const cleanupNetworkErrors = suppressPaymentGatewayErrors();

      // Preload payment script
      addRazorpayScriptWithCSP();

      // Cleanup on unmount
      return () => {
        cleanupBrowserFixes?.();
        cleanupNetworkErrors?.();
      };
    }
  }, [isOpen]);

  const processRazorpayPayment = async () => {
    try {
      setIsProcessing(true);

      // Create order
      const orderData = await createOrderMutation.mutateAsync({
        courseId: course.id,
      });

      // Load Razorpay script with improved error handling
      try {
        await loadRazorpayScript();
      } catch (scriptError) {
        const errorInfo = handlePaymentErrors(scriptError);
        throw new Error(errorInfo.message);
      }

      // Validate Razorpay key
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey || razorpayKey === "rzp_test_key") {
        throw new Error("Payment gateway not properly configured");
      }

      // Simplified and more reliable Razorpay options
      const options = {
        key: razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.id,
        name: "Learning Management System",
        description: `Purchase ${course.title}`,
        image: course.thumbnail || "/logo.png",
        // Simplified method configuration to avoid browser feature conflicts
        method: {
          upi: true,
          card: true,
          wallet: true,
          netbanking: true,
          emi: true,
        },
        handler: async (response: any) => {
          console.log(
            `🎉 CLIENT: Payment Success Response Received for Course: ${course.id}`
          );
          console.log(
            `💳 CLIENT: Payment Details - Order ID: ${response.razorpay_order_id}, Payment ID: ${response.razorpay_payment_id}`
          );

          try {
            console.log(
              `🔄 CLIENT: Verifying payment for course ${course.id}...`
            );

            // Verify payment
            const result = await verifyPaymentMutation.mutateAsync({
              courseId: course.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            console.log(
              `✅ CLIENT: Payment verification successful for course ${course.id}`
            );
            console.log(`📚 CLIENT: Server response:`, result);
            console.log(
              `🎯 CLIENT: Starting comprehensive data refresh for lecture unlock...`
            );

            // Enhanced success message with specific details
            if (result.success) {
              toast.success(
                `🎉 Payment successful! You are now enrolled in ${course.title}. All lectures have been unlocked and are ready to watch!`
              );
              setPaymentCompleted(true); // Switch button to Continue
              setIsProcessing(false);

              // Immediately invalidate enrollment queries to update UI
              console.log(
                `🔄 CLIENT: Payment modal triggering immediate enrollment query refresh for course ${course.id}`
              );
              queryClient.invalidateQueries({
                queryKey: ["course-enrollment", course.id],
              });
              queryClient.invalidateQueries({
                queryKey: ["lecture-progress", course.id],
              });
              queryClient.invalidateQueries({
                queryKey: ["course-detail", course.id],
              });
              queryClient.invalidateQueries({
                queryKey: ["course-lectures", course.id],
              });

              // Update parent component immediately
              console.log(
                `🔄 CLIENT: Triggering parent component state update for course ${course.id}`
              );
              onSuccess?.();
            } else {
              console.warn(
                `⚠️ CLIENT: Payment verification returned success=false:`,
                result
              );
              toast.error(`Payment verification failed: ${result.message}`);
              setIsProcessing(false);
              return;
            }
          } catch (error) {
            console.error(
              `💥 CLIENT: Payment verification failed for course ${course.id}:`,
              error
            );
            const errorInfo = handlePaymentErrors(error);
            toast.error(`Payment verification failed: ${errorInfo.message}`);
            setIsProcessing(false);
          }
        },
        prefill: {
          name: currentUser
            ? `${currentUser.firstName || ""} ${
                currentUser.lastName || ""
              }`.trim()
            : "",
          email: currentUser?.email || "",
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.info("Payment cancelled");
          },
          // Disable escape key to prevent accidental closure
          escape: false,
          // Handle payment failures gracefully
          confirm_close: true,
        },
        // Add retry configuration
        retry: {
          enabled: false,
        },
        // Disable remember customer to avoid localStorage issues
        remember_customer: false,
      };

      const rzp = new window.Razorpay(options);

      // Handle checkout errors
      rzp.on("payment.failed", (response: any) => {
        console.error("Payment failed:", response.error);
        const errorInfo = handlePaymentErrors(response.error);
        toast.error(errorInfo.message);
        setIsProcessing(false);
      });

      rzp.open();
    } catch (error) {
      console.error("Razorpay payment failed:", error);
      const errorInfo = handlePaymentErrors(error);
      toast.error(errorInfo.message);
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        {/* Increased from sm:max-w-md to accommodate more content */}
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Complete Your Purchase</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 rounded-full p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Choose your payment method and complete the purchase to enroll in
            the course.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Info */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{course.title}</h3>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(course.price)}
              </p>
            </div>
          </div>

          {/* Browser Compatibility Warning */}
          {browserIssues.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800">
                    Browser Compatibility Issues Detected:
                  </div>
                  <ul className="mt-1 text-yellow-700 space-y-1">
                    {browserIssues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                  <div className="mt-2 text-xs text-yellow-600">
                    Try disabling ad blockers or use a different browser if
                    payment fails.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-4">
            <h4 className="font-medium">Choose Payment Method</h4>

            <Card className="cursor-pointer border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Wallet className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Secure Payment Gateway</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4" />
                      <span>UPI (PhonePe, Paytm, GPay)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4" />
                      <span>Debit/Credit Cards</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Banknote className="w-4 h-4" />
                      <span>Net Banking</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <QrCode className="w-4 h-4" />
                      <span>QR Code</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Note */}
            <div className="text-xs text-gray-500 text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              🔒 Your payment is secured by 256-bit SSL encryption and processed
              through Razorpay's PCI DSS compliant platform
            </div>

            {/* Payment Button */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing}
              >
                {paymentCompleted ? "Close" : "Cancel"}
              </Button>
              {!paymentCompleted && (
                <Button
                  onClick={processRazorpayPayment}
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${formatPrice(course.price)}`
                  )}
                </Button>
              )}
              {paymentCompleted && (
                <Button
                  onClick={() => {
                    console.log(
                      `🚀 CLIENT: Continue Learning clicked - navigating to course progress for ${course.id}`
                    );

                    // Trigger one final query invalidation to ensure fresh enrollment status
                    queryClient.invalidateQueries({
                      queryKey: ["course-enrollment", course.id],
                    });

                    onClose();
                    // Small delay to ensure modal closes and queries update before navigation
                    setTimeout(() => {
                      router.push(`/course-progress/${course.id}`);
                    }, 200);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Continue Learning
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
