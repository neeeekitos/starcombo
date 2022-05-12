import {useEffect, useRef} from 'react';
import {
  Avatar,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Stack,
  useDisclosure
} from '@chakra-ui/react';
import {CloseIcon, HamburgerIcon} from '@chakra-ui/icons';
import Link from "next/link"
import {useStarknet} from "../hooks/useStarknet";
import {useTransactions} from "../hooks/useTransactions";
import starcomboLogo from "../utils/assets/logo/starcombo.png"
import {NotificationManager} from 'react-notifications';
import Image from "next/image";

const Links = [
  {
    name: 'Combos',
    target: '/combos'
  }
];


const NavLink = ({target, name}: { target: string, name: string }) => (
  <Link
    href={target}
    passHref>
    {name}
  </Link>
);

const Navbar = () => {

  const {account, provider, connectWallet, disconnect} = useStarknet();
  const {transactionHistory, updateTransactionStatus} = useTransactions();
  const timer = useRef(null);
  const {isOpen, onOpen, onClose} = useDisclosure();

  //Update transaction status
  useEffect(() => {
    if (!provider) return
    timer.current = setInterval(() => {
      updateTransactionStatus(provider);
    }, 30 * 1000);
    return () => {
      if (timer.current !== null) clearInterval(timer.current);
    };
  }, [provider]);

  const walletConnection = async () => {
    const error = await connectWallet()
    if (error) NotificationManager.error(error);
    if (!error) NotificationManager.success('Connected');
  }

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
            <Link href={"/"}>
              <Flex flexDir={"row"} alignItems={"center"} gap={"10px"} cursor={"pointer"}>
                <Image width={"40px"} height={"40px"} src={starcomboLogo}/>
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

              </Flex>
            </Link>

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
                  src={"https://pbs.twimg.com/profile_images/1024585501901303808/m92jEcPI_400x400.jpg"}
                />
              </MenuButton>
              <MenuList
                bg="brand.navbar"
                padding={0}
              >
                <MenuItem
                  _active={{bg: "brand.navbar"}}
                  _focus={{bg: "brand.body"}}
                  onClick={() => window.open(`https://goerli.voyager.online/contract/${account?.address}`, "_blank")}>
                  {account?.address}
                </MenuItem>
                <MenuDivider margin={0}/>
                <MenuItem
                  _active={{bg: "brand.navbar"}}
                  _focus={{bg: "brand.body"}}>
                  <Flex flexDir={"column"}>
                    <h2>Your Transactions</h2>

                    {transactionHistory.length > 0 && transactionHistory.map((transaction) => {
                      return (
                        <div onClick={() => window.open(`https://goerli.voyager.online/tx/${transaction.tx_hash}`)}
                             key={transaction.tx_hash}>
                          {transaction.tx_hash} - {transaction.status} - {transaction.status === "REJECTED"}
                        </div>
                      )
                    })
                    }
                    {transactionHistory.length === 0 && <div> No pending transactions</div>}
                  </Flex>
                </MenuItem>
                <MenuDivider margin={0}/>
                <MenuItem
                  _focus={{bg: "brand.body"}}
                  _active={{bg: "brand.navbar"}}
                  onClick={() => disconnect()}
                >
                  Disconnect Wallet
                </MenuItem>
              </MenuList>
            </Menu>}
            {!account &&
            <div>
              <Button
                background="transparent"
                _hover={{bg: "brand.body"}}
                _active={{bg: "brand.navbar"}}
                onClick={() => walletConnection()}
              >
                Connect Wallet
              </Button>
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
