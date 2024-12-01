import React, { MouseEventHandler } from 'react';
import {
  Box,
  Button,
  chakra,
  HStack,
  Text,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { Link, useLocation } from 'react-router-dom';

const ColorModeToggle = () => {
  const { toggleColorMode } = useColorMode();

  const icon = useColorModeValue(<MoonIcon />, <SunIcon />);
  const onClickToggle: MouseEventHandler<HTMLButtonElement> = () => {
    toggleColorMode();
    console.log('Toggle Color Mode');
  };
  return <Button onClick={onClickToggle}>{icon}</Button>;
};

export const BaseLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const getTitle = () => {
    if (location.pathname === '/shoppingLists') {
      return 'ShoppingList';
    } else if (location.pathname === '/items') {
      return 'Item';
    }
    return '';
  };

  return (
    <Box
      bg={'gray.200'}
      _dark={{ bg: 'gray.800' }}
      minH={'100vh'}
      display={'flex'}
      flexDirection={'column'}
    >
      <HStack p={4} bg={'teal.400'} justifyContent="space-between" alignItems="center">
        <a href={'/'}>FWE WS24/25</a>

        <Text flex={1} textAlign="center" fontSize="2xl" fontWeight="bold">
          {getTitle()}
        </Text>

        <Box gap={4} display={'flex'}>
          {location.pathname === '/shoppingLists' ? (
            <Button as={Link} to="/items">
              Item
            </Button>
          ) : (
            <Button as={Link} to="/shoppingLists">
              ShoppingList
            </Button>
          )}
          <ColorModeToggle />
        </Box>
      </HStack>
      <chakra.main
        flex={1}
        px={4}
        py={8}
        overflowX="hidden"
        display="flex"
        flexDirection="column"
        ml="auto"
        mr="auto"
        maxWidth="90rem"
        width="100%"
      >
        {children}
      </chakra.main>
    </Box>
  );
};
