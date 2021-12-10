import React from 'react';

import {
  Navbar,
  Classes,
  NavbarGroup,
  Alignment,
  NavbarHeading,
  Button,

} from '@blueprintjs/core';

import {IconNames} from '@blueprintjs/icons';

export interface MainNavigationProps {
  toggleSettingsVisible: (() => void);
}

export default function MainNavigation(props: MainNavigationProps) {

  return (
    <Navbar className={Classes.DARK}>
      <NavbarGroup align={Alignment.LEFT}>
        <img
          src='udap-logo.png'
          alt='UDAP Logo'
          className='nav-logo'
          />
        <NavbarHeading>UDAP Test App</NavbarHeading>
      </NavbarGroup>

      <NavbarGroup align={Alignment.RIGHT}>
        <Button
          onClick={() => props.toggleSettingsVisible()}
          icon={IconNames.COG}
          large={true}
          >
        </Button>
      </NavbarGroup>
    </Navbar>
  );
}