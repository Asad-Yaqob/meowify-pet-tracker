import { useState, useEffect, useEffectEvent } from 'react';
import { Icon } from '@iconify/react';
import FullLogo from '../../shared/logo/FullLogo';
import Profile from './Profile';
import SidebarLayout from '../sidebar/Sidebar';
import { useTheme } from 'src/components/provider/theme-provider';

import { Sheet, SheetContent, SheetTitle } from 'src/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Search from './Search';

const Header = () => {
  const { theme, setTheme } = useTheme();
  const [isSticky, setIsSticky] = useState(false);
  const [mobileMenu, setMobileMenu] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleScroll = useEffectEvent(() => {
    if (window.scrollY > 50) {
      setIsSticky(true);
    } else {
      setIsSticky(false);
    }
  });

  const handleResize = useEffectEvent(() => {
    if (window.innerWidth > 1023) {
      setIsOpen(false);
    }
  });

  useEffect(() => {
    // Use stable callbacks inside the effect
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Run once on mount
    handleResize();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleMode = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleMobileMenu = () => {
    if (mobileMenu === 'active') {
      setMobileMenu('');
    } else {
      setMobileMenu('active');
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-[2] bg-primary ${isSticky ? 'shadow-md shadow-primary/30' : ''}`}
      >
        <nav className="rounded-none bg-transparent dark:bg-transparent py-4 px-6 !max-w-full flex justify-between items-center">
          {/* Mobile Toggle Icon */}
          <span
            onClick={() => setIsOpen(true)}
            className="px-[15px] text-white hover:text-white relative after:absolute after:w-10 after:h-10 after:rounded-full hover:after:bg-white/20 after:bg-transparent rounded-full xl:hidden flex justify-center items-center cursor-pointer"
          >
            <Icon icon="tabler:menu-2" height={20} />
          </span>

          <div className="hidden xl:flex items-center gap-2">
            <Search />
          </div>

          {/* mobile-logo */}
          <div className="block xl:hidden">
            <FullLogo />
          </div>

          <div className="xl:!block !hidden md:!hidden">
            <div className="flex gap-0 items-center">
              {/* Theme Toggle */}
              {theme === 'light' ? (
                <div
                  className="px-15 group focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-white relative"
                  onClick={toggleMode}
                >
                  <span className="flex items-center justify-center relative after:absolute after:w-10 after:h-10 after:rounded-full after:-top-1/2 group-hover:after:bg-white/20">
                    <Icon icon="tabler:moon" width="20" />
                  </span>
                </div>
              ) : (
                <div
                  className="px-15 focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-white group relative"
                  onClick={toggleMode}
                >
                  <span className="flex items-center justify-center relative after:absolute after:w-10 after:h-10 after:rounded-full after:-top-1/2 group-hover:after:bg-white/20">
                    <Icon icon="solar:sun-bold-duotone" width="20" />
                  </span>
                </div>
              )}

              {/* Messages Dropdown */}
              {/* <Messages /> */}

              {/* Profile Dropdown */}
              <Profile />
            </div>
          </div>
          {/* Mobile Toggle Icon */}
          <span className="flex xl:hidden " onClick={handleMobileMenu}>
            <div className="xl:hidden flex w-full">
              <div className="flex justify-center items-center">
                {theme === 'light' ? (
                  <div
                    className="px-1 sm:px-15 group focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-white relative"
                    onClick={toggleMode}
                  >
                    <span className="flex items-center justify-center relative after:absolute after:w-10 after:h-10 after:rounded-full after:-top-1/2 group-hover:after:bg-white/20">
                      <Icon icon="tabler:moon" width="20" />
                    </span>
                  </div>
                ) : (
                  <div
                    className="px-1 sm:px-15 focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-white group relative"
                    onClick={toggleMode}
                  >
                    <span className="flex items-center justify-center relative after:absolute after:w-10 after:h-10 after:rounded-full after:-top-1/2 group-hover:after:bg-white/20">
                      <Icon icon="solar:sun-bold-duotone" width="20" />
                    </span>
                  </div>
                )}
                {/* <Messages /> */}
                <Profile />
              </div>
            </div>
          </span>
        </nav>
      </header>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <VisuallyHidden>
            <SheetTitle>sidebar</SheetTitle>
          </VisuallyHidden>
          <SidebarLayout onClose={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Header;
