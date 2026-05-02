'use client';

import { useNavigate } from 'react-router';
// import profileimg from 'src/assets/images/profile/user-1.jpg'; // Removed static image
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import { Button } from 'src/components/ui/button';
import { useAuth } from 'src/context/auth/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/portal/login');
  };

  const displayName = user?.name || 'Admin';
  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
    : 'AD';

  return (
    <div className="relative group/menu ps-1 sm:ps-15 shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className="hover:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary w-[35px] h-[35px]">
            {/* Show initials if no image (image logic can be added later if backend provides it) */}
            <div className="w-full h-full rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm border border-primary/20">
              {initials}
            </div>
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-screen sm:w-[200px] pb-6 pt-4 rounded-sm"
        >
          <div className="px-4 pb-4 border-b border-border mb-2">
            <h6 className="text-sm font-semibold text-foreground">{displayName}</h6>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>

          {/* <SimpleBar className="max-h-[300px]">
            {profileData.profileDD.map((items, index) => (
              <DropdownMenuItem
                key={index}
                asChild
                className="px-4 py-2 flex justify-between items-center bg-hover group/link w-full cursor-pointer"
              >
                <Link to={items.url}>
                  <div className="w-full">
                    <div className="ps-0 flex items-center gap-3 w-full">
                      <Icon
                        icon={items.icon}
                        className="text-lg text-muted-foreground group-hover/link:text-primary"
                      />
                      <div className="w-3/4">
                        <h5 className="mb-0 text-sm text-muted-foreground group-hover/link:text-primary">
                          {items.title}
                        </h5>
                      </div>
                    </div>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))}
          </SimpleBar> */}

          {/* <DropdownMenuSeparator className='my-2' /> */}

          <div className="pt-2 px-4">
            <Button
              variant="outline"
              className="w-full rounded-md"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Profile;
