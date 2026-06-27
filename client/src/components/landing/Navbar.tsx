// components/landing/Navbar.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const navLinks = [
  { 
    label: "Features", 
    hasDropdown: true,
    href: "#features",
    dropdownItems: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Contributions", href: "/contributions" },
      { label: "Loans & Savings", href: "/loans" },
      { label: "Analytics", href: "/analytics" },
      { label: "Members", href: "/members" },
    ]
  },
  { 
    label: "My Chamas", 
    hasDropdown: false,
    href: "/my-chamas"
  },
  { 
    label: "Meetings", 
    hasDropdown: false,
    href: "/meetings"
  },
  { 
    label: "Resources", 
    hasDropdown: true,
    href: "#resources",
    dropdownItems: [
      { label: "Create Chama", href: "/create-chama" },
      { label: "Join Chama", href: "/join-chama" },
      { label: "Settings", href: "/settings" },
      { label: "Help Center", href: "#help" },
    ]
  },
];

export function Navbar() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const handleNavigation = (href: string) => {
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
    
    // Check if it's an anchor link (starts with #)
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      } else {
        // If element not found, navigate to home
        navigate('/');
      }
    } else {
      // Navigate to the route
      navigate(href);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const handleAuthClick = (action: 'login' | 'signup') => {
    if (action === 'login') {
      navigate('/auth');
    } else {
      navigate('/auth');
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 h-[72px] bg-white border-b border-gray-100/50 z-50"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-[72px] h-full flex items-center justify-between">
        {/* Left - Logo */}
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-8 h-8 bg-[#6D3DF5] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-xl font-bold text-[#1C2340]">changa</span>
        </div>

        {/* Center - Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8" ref={dropdownRef}>
          {navLinks.map((link) => (
            <div key={link.label} className="relative">
              <button
                onClick={() => {
                  if (link.hasDropdown) {
                    toggleDropdown(link.label);
                  } else {
                    handleNavigation(link.href);
                  }
                }}
                className="text-[15px] font-medium text-[#5E6478] hover:text-[#6D3DF5] transition-colors flex items-center gap-1 group"
              >
                {link.label}
                {link.hasDropdown && (
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-200 ${
                      openDropdown === link.label ? "rotate-180" : ""
                    }`}
                  />
                )}
              </button>

              {/* Dropdown Menu */}
              {link.hasDropdown && openDropdown === link.label && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 min-w-[200px] bg-white rounded-xl shadow-lg border border-gray-100/50 py-2 z-50"
                >
                  {link.dropdownItems?.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleNavigation(item.href)}
                      className="w-full text-left px-4 py-2.5 text-[14px] text-[#5E6478] hover:text-[#6D3DF5] hover:bg-purple-50/50 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </div>

        {/* Right - Auth Buttons (Desktop) */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          <button 
            onClick={() => handleAuthClick('login')}
            className="text-[15px] font-medium text-[#5E6478] hover:text-[#1C2340] transition-colors"
          >
            Log in
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAuthClick('signup')}
            className="h-[44px] px-[24px] lg:px-[28px] bg-[#6D3DF5] text-white rounded-xl font-medium text-[15px] hover:bg-[#5B2FD6] transition-colors shadow-sm hover:shadow-md"
          >
            Get Started
          </motion.button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-[#1C2340]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-b border-gray-100 absolute top-[72px] left-0 right-0 shadow-lg max-h-[calc(100vh-72px)] overflow-y-auto"
          >
            <div className="px-[20px] py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <div key={link.label}>
                  <button
                    onClick={() => {
                      if (link.hasDropdown) {
                        toggleDropdown(link.label);
                      } else {
                        handleNavigation(link.href);
                      }
                    }}
                    className="text-[16px] font-medium text-[#5E6478] hover:text-[#6D3DF5] transition-colors text-left flex items-center justify-between w-full"
                  >
                    <span>{link.label}</span>
                    {link.hasDropdown && (
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform duration-200 ${
                          openDropdown === link.label ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>
                  
                  {/* Mobile Dropdown Items */}
                  {link.hasDropdown && openDropdown === link.label && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-4 mt-2 border-l-2 border-purple-100 pl-4 space-y-2 overflow-hidden"
                    >
                      {link.dropdownItems?.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            handleNavigation(item.href);
                          }}
                          className="block w-full text-left py-2 text-[15px] text-[#5E6478] hover:text-[#6D3DF5] transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
              
              <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
                <button 
                  onClick={() => handleAuthClick('login')}
                  className="text-[16px] font-medium text-[#5E6478] hover:text-[#1C2340] transition-colors text-left"
                >
                  Log in
                </button>
                <button 
                  onClick={() => handleAuthClick('signup')}
                  className="h-[46px] w-full bg-[#6D3DF5] text-white rounded-xl font-medium text-[16px] hover:bg-[#5B2FD6] transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}