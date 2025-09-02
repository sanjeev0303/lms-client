"use client";

import { useUser } from "@clerk/nextjs";
import { Menu, School } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import CustomUserButton from "../auth/custom-user-button";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { ModeToggle } from "./theme-toggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn } = useUser();

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const handleAuthClick = () => {
    setIsOpen(false);
  };

  const navItems = [
    {
      name: "Home",
      path: "/",
    },
    {
      name: "Courses",
      path: "/courses",
    },
    {
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      name: "About",
      path: "/about",
    },
    {
      name: "Contact",
      path: "/contact",
    },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="flex items-center gap-2 group">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
                <School size={24} className="text-primary" />
              </div>
              <h1 className="font-bold text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors duration-200">
                E-Learning
              </h1>
            </div>
          </Link>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ModeToggle />
            {isSignedIn ? (
              <CustomUserButton />
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/sign-up">Sign up</Link>
                </Button>
                <Button asChild>
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <ModeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  aria-label="Toggle menu"
                >
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 sm:w-96">
                <SheetHeader className="text-left mb-6">
                  <SheetTitle className="flex items-center gap-2">
                    <School size={24} className="text-primary" />
                    E-Learning
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-full">
                  {/* Navigation Links */}
                  <div className="flex-1 space-y-2">
                    {navItems.map((item) => (
                      <SheetClose asChild key={item.name}>
                        <Link
                          href={item.path}
                          onClick={handleLinkClick}
                          className="block px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-accent hover:text-primary transition-colors duration-200"
                        >
                          {item.name}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>

                  {/* Bottom Actions */}
                  <div className="border-t border-border pt-6 space-y-3">
                    {isSignedIn ? (
                      <div className="px-4">
                        <CustomUserButton />
                      </div>
                    ) : (
                      <div className="space-y-2 px-4">
                        <Link href="/sign-up" onClick={handleAuthClick}>
                          <Button variant="outline" className="w-full">
                            Sign up
                          </Button>
                        </Link>
                        <Link href="/sign-in" onClick={handleAuthClick}>
                          <Button className="w-full">Sign in</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
