// src/components/layout/BottomNav.jsx
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { ReactComponent as HomeIcon } from "../../assets/icons/icon_b_home.svg";
import { ReactComponent as CalendarIcon } from "../../assets/icons/icon_b_calendar.svg";
import { ReactComponent as MapIcon } from "../../assets/icons/icon_b_map.svg";
import { ReactComponent as StampIcon } from "../../assets/icons/icon_b_stamp.svg";
import { ReactComponent as MyIcon } from "../../assets/icons/icon_b_my.svg";

const NavWrapper = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 0 auto; 
  max-width: ${({ theme }) => theme.layout.maxWidth};
  height: 68px;
  display: flex;
  border-top: 1px solid ${({ theme }) => theme.colors.outlineGray};
  background-color: ${({ theme }) => theme.colors.bgWhite};
  z-index: 10;
`;

const NavItem = styled(NavLink)`
  flex: 1; 
  display: flex;
  flex-direction: column;
  align-items: center; 
  justify-content: flex-start; 
  padding-top: 8px; 
  text-decoration: none;
  color: ${({ theme }) => theme.colors.lightGray};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};

  &.active {
    color: ${({ theme }) => theme.colors.themeOrange};
  }

  svg {
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
    fill: currentColor;
  }
`;

function BottomNav() {
  return (
    <NavWrapper>
      <NavItem to="/">
        <HomeIcon />
        홈
      </NavItem>
      <NavItem to="/calendar">
        <CalendarIcon />
        캘린더
      </NavItem>
      <NavItem to="/map">
        <MapIcon />
        주변공연
      </NavItem>
      <NavItem to="/stamps">
        <StampIcon />
        스탬프
      </NavItem>
      <NavItem to="/mypage">
        <MyIcon />
        마이페이지
      </NavItem>
    </NavWrapper>
  );
}

export default BottomNav;
