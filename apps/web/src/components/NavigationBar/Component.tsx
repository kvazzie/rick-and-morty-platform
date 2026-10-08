import { AcmeLogo } from './AcmeLogo';
import { NavLink, useLocation, useNavigation } from 'react-router';
import { Link } from '@heroui/link';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@heroui/navbar';
const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/characters', label: 'Characters' },
  { path: '/locations', label: 'Locations' },
  { path: '/episodes', label: 'Episodes' },
];

export function NavigationBar() {
  const { pathname } = useLocation();
  const navigation = useNavigation();
  return (
    <Navbar shouldHideOnScroll>
      <NavbarBrand>
        <AcmeLogo />
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {navLinks.map((link) => (
          <NavbarItem key={link.path} className="content-center">
            <Link
              as={NavLink}
              to={link.path}
              size="lg"
              isBlock
              color={
                pathname === link.path
                  ? 'success'
                  : navigation.location?.pathname === link.path
                    ? 'foreground'
                    : 'primary'
              }
              className="transition-colors-opacity"
            >
              {link.label}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>
    </Navbar>
  );
}
