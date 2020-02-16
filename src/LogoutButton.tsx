import React, { forwardRef } from "react";
import { useLogout } from "react-admin";
import MenuItem from "@material-ui/core/MenuItem";
import ExitIcon from "@material-ui/icons/PowerSettingsNew";

const LogoutButton = forwardRef((props, ref) => {
  const logout = useLogout();
  const handleClick = () => logout();
  return (
    <MenuItem onClick={handleClick}>
      <ExitIcon /> Logout
    </MenuItem>
  );
});

export default LogoutButton;
