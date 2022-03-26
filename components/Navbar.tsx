// import {useStarknet} from "../hooks/useStarknet";
import {getStarknet} from "@argent/get-starknet/dist";
import {ReactNode} from 'react';
import {
  Box,
  Flex,
  Avatar,
  HStack,
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
import Link from "next/link"
import {useStarknet} from "../hooks/useStarknet";

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

const NavLink = ({children, target, name}: { children: ReactNode, target: string, name: string }) => (
  <Link href={target} passHref>
    <Button
      py={1}
      rounded={'md'}
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}
    >
      {name}
    </Button>
  </Link>
);

const Navbar = () => {

  const {account, setAccount, provider, setProvider, connectWallet, disconnect} = useStarknet();


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
                <NavLink key={link.name} target={link.target} name={link.name}/>
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
                <NavLink key={link.name} target={link.target} name={link.name}/>
              ))}
            </Stack>
          </Box>
        ) : null}
      </Box>
    </>
  );
}

export default Navbar