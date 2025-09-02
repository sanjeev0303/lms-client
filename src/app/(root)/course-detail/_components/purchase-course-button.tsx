"use client"

import PaymentModal from '@/components/payment/PaymentModal';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Play, ShoppingCart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { logger } from '@/lib/utils/logger';

interface PurchaseCourseButtonProps {
  courseId: string;
  isEnrolled?: boolean;
  isLoading?: boolean;
  course?: {
    id: string;
    title: string;
    price: number;
    thumbnail?: string;
  };
}

const PurchaseCourseButton = ({
  courseId,
  isEnrolled = false,
  isLoading = false,
  course
}: PurchaseCourseButtonProps) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleClick = () => {
    logger.debug('PURCHASE', 'Purchase button clicked', { isEnrolled, courseId });

    if (isEnrolled) {
      // Navigate to course learning page or first lecture
      router.push(`/course-progress/${courseId}`);
    } else {
      // Open payment modal
      logger.debug('PURCHASE', 'Opening payment modal', { courseId });
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    logger.info('PURCHASE', 'Payment success callback triggered', { courseId });

    // Immediately invalidate enrollment status to update button text
    queryClient.invalidateQueries({
      queryKey: ['course-enrollment', courseId]
    });

    // Small delay to allow for backend processing and then trigger comprehensive refresh
    setTimeout(() => {
      logger.info('PURCHASE', 'Triggering comprehensive page refresh to update UI with unlocked lectures', { courseId });

      // Invalidate all related queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ['course-enrollment', courseId]
      });
      queryClient.invalidateQueries({
        queryKey: ['course-detail', courseId]
      });
      queryClient.invalidateQueries({
        queryKey: ['lecture-progress', courseId]
      });
      queryClient.invalidateQueries({
        queryKey: ['course-lectures', courseId]
      });

      // Force a complete page refresh to ensure everything updates
      logger.debug('PURCHASE', 'Executing router.refresh() to ensure UI consistency', { courseId });
      router.refresh();

      // Close modal after refresh
      setShowPaymentModal(false);
    }, 1500); // Reduced back to 1500ms since we're doing immediate invalidation first
  };  if (isLoading) {
    return (
      <div className='w-full'>
        <Button disabled className='w-full'>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading...
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className='w-full'>
        <Button
          className='w-full text-gray-600'
          onClick={handleClick}
          variant={isEnrolled ? "default" : "default"}
        >
          {isEnrolled ? (
            <>
              <Play className="w-4 h-4 mr-2" />
              Continue Learning
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Purchase Course
            </>
          )}
        </Button>
      </div>

      {/* Payment Modal */}
      {course && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          course={course}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  )
}

export default PurchaseCourseButton
