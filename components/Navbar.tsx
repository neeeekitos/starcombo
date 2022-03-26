import {useStarknet} from "../hooks/useStarknet";
import {getStarknet} from "@argent/get-starknet/dist";

import {ReactNode} from 'react';
import {
  Box,
  Flex,
  Avatar,
  HStack,
  Link,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack, Heading,
} from '@chakra-ui/react';
import {HamburgerIcon, CloseIcon} from '@chakra-ui/icons';

const Links = [
  {
    name: 'Home',
    target: '/'
  },
  {
    name: 'Combos',
    target: '/combos'
  }
];

const NavLink = ({children, target}: { children: ReactNode, target: string }) => (
  <Link
    px={2}
    py={1}
    rounded={'md'}
    _hover={{
      textDecoration: 'none',
      bg: useColorModeValue('gray.200', 'gray.700'),
    }}
    href={target}>
    {children}
  </Link>
);

const Navbar = () => {

  const {account, setAccount, setProvider, connectWallet, disconnect} = useStarknet((state) => ({
    account: state.account,
    setAccount: state.setAccount,
    setProvider: state.setProvider,
    connectWallet: state.connectWallet,
    disconnect: state.disconnect
  }));

  const {isOpen, onOpen, onClose} = useDisclosure();

  return (
    <>
      <Box borderBottom={"1px solid white"} px={4} w={"100%"}>
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            size={'md'}
            icon={isOpen ? <CloseIcon/> : <HamburgerIcon/>}
            aria-label={'Open Menu'}
            display={{md: 'none'}}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={8} alignItems={'center'}>
            <Heading
              as={"h1"}
              bgGradient='linear(to-r, #F0C3EC, #7F6AFF)'
              bgClip='text'
              fontSize={['6l', '7l', '8l', '8l']}
              fontWeight='extrabold'
              isTruncated
            >
              StarCombo
            </Heading>
            <HStack
              as={'nav'}
              spacing={4}
              display={{base: 'none', md: 'flex'}}>
              {Links.map((link) => (
                <NavLink key={link.name} target={link.target}>{link.name}</NavLink>
              ))}
            </HStack>
          </HStack>
          <Flex alignItems={'center'}>
            {account &&
            <Menu>
              <MenuButton
                as={Button}
                rounded={'full'}
                variant={'link'}
                cursor={'pointer'}
                minW={0}>
                <Avatar
                  size={'sm'}
                  src={""
                  }
                />
              </MenuButton>
              <MenuList>
                <MenuItem>{account?.address}</MenuItem>
                <MenuDivider/>
                <MenuItem> <Button onClick={() => disconnect()}>Disconnect Wallet</Button></MenuItem>
              </MenuList>
            </Menu>}
            {!account &&
            <div>
              <Button onClick={() => connectWallet()}>Connect Wallet</Button>
            </div>}
          </Flex>
        </Flex>

        {isOpen ? (
          <Box pb={4} display={{md: 'none'}}>
            <Stack as={'nav'} spacing={4}>
              {Links.map((link) => (
                <NavLink key={link.name} target={link.target}>{link.name}</NavLink>
              ))}
            </Stack>
          </Box>
        ) : null}
      </Box>
    </>
  );

  // return (
  //   <>
  //     <Flex
  //       w="100%"
  //       px="6"
  //       py="5"
  //       align="left"
  //       justify="space-between"
  //       borderBottom={"1px solid white"}
  //     >
  //       <HStack as="nav" spacing="5">
  //         {account &&
  //         <div>
  //           {account.address}
  //           <Button onClick={() => disconnect()}>Disconnect</Button>
  //
  //         </div>
  //         }
  //         {!account &&
  //         <div>
  //           <Button onClick={() => connectWallet()}>Connect Wallet</Button>
  //         </div>}
  //       </HStack>
  //
  //
  //     </Flex>
  //   </>
  // )
}

export default Navbar