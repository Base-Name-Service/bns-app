import { useState, ChangeEvent, useCallback } from "react";
import Head from "next/head";
import { Inter } from "next/font/google";
import { debounce } from "lodash";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";
import Link from "next/link";
// import styles from "@/styles/Home.module.css";

// const inter = Inter({ subsets: ["latin"] });

import {
  Flex,
  Button,
  Input,
  Text,
  InputGroup,
  // InputLeftAddon,
  InputLeftElement,
  Stack,
  VStack,
  HStack,
  Box,
  Spacer,
  Badge,
  InputRightElement,
  Spinner,
  Avatar,
  Alert,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
  Image,
} from "@chakra-ui/react";
import { SearchIcon, CheckIcon, WarningTwoIcon } from "@chakra-ui/icons";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useContract,
  useProvider,
  useSigner,
  useNetwork,
  useSwitchNetwork,
} from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
const namehash = require("@ensdomains/eth-ens-namehash");
import { ethers } from "ethers";
import { baseGoerli } from "wagmi/chains";
import { bnsRegistryABI } from "../abi/bnsRegistryABI";
import { bnsRegistrarABI } from "../abi/bnsRegistrarABI";

export default function Home() {
  const [bns, setBNS] = useState("");
  const [isBnsAvailable, setIsBnsAvailable] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [validationBnsErrors, setValidationBnsErrors] = useState<String[]>([]);
  const {
    isOpen: isConnectWalletModalOpen,
    onOpen: onConnectWalletModalOpen,
    onClose: onConnectWalletModalClose,
  } = useDisclosure();
  const {
    isOpen: isSwitchNetworkModalOpen,
    onOpen: onSwitchNetworkModalOpen,
    onClose: onSwitchNetworkModalClose,
  } = useDisclosure();
  const {
    isOpen: isClaimCongratsModalOpen,
    onOpen: onClaimCongratsModalOpen,
    onClose: onClaimCongratsModalClose,
  } = useDisclosure();
  const { width: windowWidth, height: windowHeight } = useWindowSize();

  // web3
  const provider = useProvider();
  const { chain } = useNetwork();
  const {
    chains,
    error,
    isLoading: isLoadingSwitchNetwork,
    pendingChainId,
    switchNetwork,
  } = useSwitchNetwork();

  const { data: signer, isError, isLoading } = useSigner();

  const labelhash = (label: string) =>
    ethers.utils.keccak256(ethers.utils.toUtf8Bytes(label));

  // wallet address
  const { address, isConnected } = useAccount();

  // connect and disconnect
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();

  // contracts
  const bnsRegistryContract = useContract({
    address: "0x79c7f080AcF45a89171675F636959ae971a378EB",
    abi: bnsRegistryABI,
    signerOrProvider: provider,
  });

  const bnsRegistrarContract = useContract({
    address: "0x83A6bA240472a2E537DE6Abd39162B9Fd449133c",
    abi: bnsRegistrarABI,
    signerOrProvider: signer,
  });

  const handleBnsOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValidationBnsErrors([]);
    // TODO: validate input
    if (showClaim) {
      setShowClaim(false);
    }

    setBNS(e.target.value);
  };

  const handleSearch = async () => {
    const isValidLettersOrNumbers = bns.match(/^[A-Za-z0-9]*$/);
    const isValidLength = bns.match(/^[A-Za-z0-9]{5,}$/);
    const errors = [];

    if (!isValidLettersOrNumbers) {
      errors.push("Only letters and numbers are allowed");
    }

    if (!isValidLength) {
      errors.push("BNS must be at least 5 characters long");
    }
    console.log("validationBnsErrors", validationBnsErrors);

    if (errors.length > 0) {
      setValidationBnsErrors(errors);
      return;
    }

    const bnsHash = namehash.hash(bns.toLocaleLowerCase() + ".base");
    console.log(`${bns}.base`, bnsHash);
    if (!bnsRegistryContract) return;

    const recordExists = await bnsRegistryContract?.recordExists(bnsHash);
    console.log(`${bns}.base`, recordExists);
    setIsBnsAvailable(!recordExists);
    setShowClaim(true);
  };

  const handleRegister = async () => {
    if (!isConnected) {
      onConnectWalletModalOpen();
      return;
    }

    if (chain?.id !== baseGoerli.id) {
      onSwitchNetworkModalOpen();
      return;
    }

    const label = labelhash(bns.toLocaleLowerCase());
    try {
      setIsClaiming(true);
      const tx = await bnsRegistrarContract?.register(label, address);
      const response = await tx.wait();
      console.log(`${bns}.base`, response);
      setClaimTxHash(response.transactionHash);
      onClaimCongratsModalOpen();
    } catch (error) {
      setIsClaiming(false);
      console.log(error);
    }
  };

  // const debouncedBnsOnChange = useCallback(
  //   debounce(handleBnsOnChange, 300),
  //   []
  // );

  return (
    <>
      <Head>
        <title>Base Name Service</title>
        <meta name="description" content="Base Name Service" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {isClaimCongratsModalOpen && (
        <Confetti width={windowWidth} height={windowHeight} />
      )}

      <Flex
        direction="column"
        // align="center"
        // justify="center"
        h="100vh"
        background={"#000"}
        w="100%"
      >
        {/* Header*/}
        <Flex w="100%" align={"center"} h="100px">
          <Flex paddingLeft={"20px"} align="center">
            <Text as="b" fontSize={"4xl"} color={"white"}>
              .base
            </Text>
            <Badge colorScheme="red" h="18px" marginLeft="8px">
              testnet
            </Badge>
          </Flex>
          <Spacer />
          <Flex paddingRight={"20px"}>
            {!isConnected && (
              <Button
                borderRadius={"12px"}
                size="lg"
                background={"#2548e5"}
                color="white"
                onClick={() => connect()}
                _hover={{
                  backgroundColor: "#2d55fa",
                  color: "#fff",
                }}
              >
                Connect Wallet
              </Button>
            )}

            {isConnected && (
              <Flex>
                <Flex
                  // border={"1px"}
                  // borderColor="white"
                  borderRadius={"12px"}
                  padding="8px"
                  align={"center"}
                  onClick={() => disconnect()}
                  bg="#1b1b1c"
                >
                  <Avatar
                    src={`https://cdn.stamp.fyi/avatar/${address}?s=160`}
                    size="sm"
                  />
                  <Text as="b" color="white" fontSize={"md"} marginLeft="5px">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </Text>
                </Flex>
              </Flex>
            )}
          </Flex>
        </Flex>
        {/* modal connect wallet */}
        <Modal
          isOpen={isConnectWalletModalOpen}
          onClose={onConnectWalletModalClose}
          isCentered
        >
          <ModalOverlay
            bg="none"
            backdropFilter="blur(10px) hue-rotate(10deg)"
          />
          <ModalContent color="white" bg="#1b1b1c" borderRadius={"12px"}>
            <ModalHeader>Connect Wallet</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex w={"100%"} direction="column">
                {isConnected && (
                  <Flex
                    w={"100%"}
                    align="center"
                    justify={"center"}
                    marginBottom="20px"
                  >
                    <Flex
                      bg="#212121"
                      // opacity="0.5"
                      w="140px"
                      h={"140px"}
                      align={"center"}
                      justify="center"
                      borderRadius="full"
                    >
                      <Flex
                        bg="#161617"
                        // opacity="0.9"
                        w="100px"
                        h={"100px"}
                        borderRadius="full"
                        align={"center"}
                        justify="center"
                      >
                        {/* <Icon as={CheckIcon} boxSize={10} color="green.300" /> */}
                        <Avatar
                          src={`https://cdn.stamp.fyi/avatar/${address}?s=160`}
                          size="md"
                        />
                      </Flex>
                    </Flex>
                  </Flex>
                )}
                {!isConnected && (
                  <Text fontSize={"l"}>
                    Please connect your wallet to claim your{" "}
                    <Badge colorScheme="blue">{bns}.base</Badge> web3 name.
                  </Text>
                )}
                {isConnected && (
                  <Flex>
                    <Text fontSize={"l"} marginLeft="5px">
                      {address?.slice(0, 6)}...{address?.slice(-4)} wallet is
                      connected. Please close the modal to continue.
                      {/* Thanks for connecPlease connect your wallet to claim your{" "}
                    <Badge colorScheme="blue">{bns}.base</Badge> web3 name. */}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </ModalBody>

            <ModalFooter>
              <Flex direction={"column"} w="100%">
                <Button
                  isDisabled={isConnected}
                  borderRadius={"12px"}
                  size="lg"
                  background={"#2548e5"}
                  color="white"
                  onClick={() => connect()}
                  _hover={{
                    backgroundColor: "#2d55fa",
                    color: "#fff",
                  }}
                >
                  Connect Wallet
                </Button>
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* modal switch network */}
        <Modal
          isOpen={isSwitchNetworkModalOpen}
          onClose={onSwitchNetworkModalClose}
          isCentered
        >
          <ModalOverlay
            bg="none"
            backdropFilter="blur(10px) hue-rotate(10deg)"
          />
          <ModalContent color="white" bg="#1b1b1c" borderRadius={"12px"}>
            <ModalHeader>Switch Network</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex w={"100%"} direction="column">
                {switchNetwork && baseGoerli.id === chain?.id && (
                  <Flex
                    w={"100%"}
                    align="center"
                    justify={"center"}
                    marginBottom="20px"
                  >
                    <Flex
                      bg="#212121"
                      // opacity="0.5"
                      w="140px"
                      h={"140px"}
                      align={"center"}
                      justify="center"
                      borderRadius="full"
                    >
                      <Flex
                        bg="#161617"
                        // opacity="0.9"
                        w="100px"
                        h={"100px"}
                        borderRadius="full"
                        align={"center"}
                        justify="center"
                      >
                        <Icon as={CheckIcon} boxSize={10} color="green.300" />
                        {/* <Image
                          src="https://goerli.basescan.org/images/logo-ether.svg?v=0.0.6"
                          alt="Base"
                        /> */}
                      </Flex>
                    </Flex>
                  </Flex>
                )}

                {switchNetwork && baseGoerli.id === chain?.id && (
                  <Text fontSize={"l"}>
                    Switched to {baseGoerli.name} network. Pleaes close the
                    modal to continue.
                  </Text>
                )}

                {switchNetwork && baseGoerli.id !== chain?.id && (
                  <Text fontSize={"l"}>
                    Please swtich to {baseGoerli.name} network to claim your{" "}
                    <Badge colorScheme="blue">{bns}.base</Badge> web3 name.
                  </Text>
                )}
              </Flex>
            </ModalBody>

            <ModalFooter>
              <Flex direction={"column"} w="100%">
                <Button
                  isDisabled={!switchNetwork || baseGoerli.id === chain?.id}
                  borderRadius={"12px"}
                  size="lg"
                  background={"#2548e5"}
                  color="white"
                  onClick={() => {
                    console.log(baseGoerli.id);
                    switchNetwork?.(baseGoerli.id);
                  }}
                  _hover={{
                    backgroundColor: "#2d55fa",
                    color: "#fff",
                  }}
                >
                  Switch to {baseGoerli.name}
                </Button>

                {/* <Button
                  // disabled={!switchNetwork || baseGoerli.id === chain?.id}
                  key={baseGoerli.id}
                  onClick={() => {
                    console.log(baseGoerli.id);
                    switchNetwork?.(baseGoerli.id);
                  }}
                >
                  Switch to {baseGoerli.name}
                  {isLoading &&
                    pendingChainId === baseGoerli.id &&
                    " (switching)"}
                </Button> */}
                <Spacer />
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* modal congrats */}
        <Modal
          isOpen={isClaimCongratsModalOpen}
          onClose={() => {
            setBNS("");
            setIsClaiming(false);
            onClaimCongratsModalClose();
          }}
          isCentered
        >
          <ModalOverlay
          // bg="none"
          // backdropFilter="blur(3px) hue-rotate(10deg)"
          />
          <ModalContent color="white" bg="#1b1b1c" borderRadius={"12px"}>
            <ModalHeader>Congrats</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Flex w={"100%"} direction="column">
                <Flex
                  w={"100%"}
                  align="center"
                  justify={"center"}
                  marginBottom="20px"
                >
                  <Flex
                    bg="#212121"
                    // opacity="0.5"
                    w="140px"
                    h={"140px"}
                    align={"center"}
                    justify="center"
                    borderRadius="full"
                  >
                    <Flex
                      bg="#0f0f0f"
                      // opacity="0.9"
                      w="100px"
                      h={"100px"}
                      borderRadius="full"
                      align={"center"}
                      justify="center"
                    >
                      <Text fontSize={"4xl"}>🎉</Text>
                    </Flex>
                  </Flex>
                </Flex>
                <Text fontSize={"l"}>
                  Congratulations for claiming your{" "}
                  <Badge colorScheme="blue">{bns}.base</Badge> web3 name.
                  {/* Please swtich to {baseGoerli.name} network to claim your{" "}
                  <Badge colorScheme="blue">{bns}.base</Badge> web3 name. */}
                </Text>
              </Flex>
            </ModalBody>

            <ModalFooter>
              <Flex direction={"column"} w="100%">
                <Link
                  legacyBehavior
                  passHref
                  href={`https://goerli.basescan.org/tx/${claimTxHash}`}
                >
                  <Button
                    as={"a"}
                    target="_blank"
                    borderRadius={"12px"}
                    size="lg"
                    background={"#2548e5"}
                    color="white"
                    _hover={{
                      backgroundColor: "#2d55fa",
                      color: "#fff",
                    }}
                  >
                    View Transaction
                  </Button>
                </Link>
                {/* <Button
                  variant={"outline"}
                  borderRadius={"12px"}
                  size="lg"
                  // background={"#2548e5"}
                  // color="white"
                  onClick={onClaimCongratsModalClose}
                  _hover={{
                    backgroundColor: "#2d55fa",
                    color: "#fff",
                  }}
                >
                  Close
                </Button> */}

                {/* <Button
                  // disabled={!switchNetwork || baseGoerli.id === chain?.id}
                  key={baseGoerli.id}
                  onClick={() => {
                    console.log(baseGoerli.id);
                    switchNetwork?.(baseGoerli.id);
                  }}
                >
                  Switch to {baseGoerli.name}
                  {isLoading &&
                    pendingChainId === baseGoerli.id &&
                    " (switching)"}
                </Button> */}
                <Spacer />
              </Flex>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* Main */}
        <Flex align="center" justify="center" w="100%" h={"100%"}>
          <Flex
            direction="column"
            align="center"
            justify="center"
            maxW={"600px"}
            w={"100%"}
            marginBottom="200px"
            paddingLeft="20px"
            paddingRight={"20px"}
          >
            <VStack w={"100%"} align="center" justify="center" spacing={"20px"}>
              {/* <Text color={"#fff"}>
                {chain && <div>Connected to {chain.name}</div>}
              </Text> */}
              <Text as="b" fontSize="6xl" color={"#fff"}>
                .base
              </Text>
              <Flex w={"100%"}>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    focusBorderColor="#2548e5"
                    value={bns}
                    // variant="filled"
                    size={"lg"}
                    borderRadius="12px"
                    // borderWidth={"2px"}
                    color={"#fff"}
                    // borderColor={"#2548e5"}
                    placeholder="yourname.base"
                    onChange={handleBnsOnChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                  />
                  {/* {showClaim && (
                    <InputRightElement children={<Spinner color="#2548e5" />} />
                  )} */}
                </InputGroup>
              </Flex>

              {/* errors */}
              <Flex direction={"column"} w="100%">
                {validationBnsErrors.map((error, index) => (
                  <Flex key={index} align="center">
                    <Icon as={WarningTwoIcon} color={"yellow.500"} />
                    <Text color={"yellow.500"} marginLeft="5px">
                      {error}
                    </Text>
                  </Flex>
                ))}
              </Flex>
              {/* isBnsAvailable true */}
              {bns && showClaim && isBnsAvailable && (
                <Flex direction={"column"} w="100%" align={"center"}>
                  <Flex
                    w="100%"
                    h={"50px"}
                    align={"center"}
                    borderRadius="12px"
                    // borderColor={"#0052FF"}
                    // borderWidth={"1px"}
                    color={"white"}
                    bg={"#1b1b1c"}
                  >
                    <Flex
                      w={"100%"}
                      h={"50px"}
                      maxW="16px"
                      borderLeftRadius={"12px"}
                      bg="#0052FF"
                    ></Flex>
                    <Flex w={"100%"} paddingEnd={"10px"} marginStart="10px">
                      <Text as={"b"}>{bns}.base</Text>
                    </Flex>
                    <Button
                      // isDisabled
                      isLoading={isClaiming}
                      loadingText="Claiming"
                      background={"#2548e5"}
                      color="white"
                      borderRadius={"12px"}
                      marginRight="5px"
                      _hover={{ backgroundColor: "#5d78f0", color: "#fff" }}
                      onClick={handleRegister}
                    >
                      Claim
                    </Button>
                  </Flex>
                </Flex>
              )}

              {/* isBnsAvailable false */}
              {bns && showClaim && !isBnsAvailable && (
                <Flex direction={"column"} w="100%" align={"center"}>
                  <Flex
                    w="100%"
                    h={"50px"}
                    align={"center"}
                    borderRadius="12px"
                    // borderColor={"#0052FF"}
                    // borderWidth={"1px"}
                    color={"white"}
                    bg={"#1b1b1c"}
                  >
                    <Flex
                      w={"100%"}
                      h={"50px"}
                      maxW="16px"
                      borderLeftRadius={"12px"}
                      bg="#ff0000"
                    ></Flex>
                    <Flex w={"100%"} paddingEnd={"10px"} marginStart="10px">
                      <Text as={"b"}>{bns}.base</Text>
                    </Flex>
                    <Button
                      isDisabled
                      background={"#ff0000"}
                      color="white"
                      borderRadius={"12px"}
                      marginRight="5px"
                      // _hover={{ backgroundColor: "#5d78f0", color: "#fff" }}
                    >
                      Claim
                    </Button>
                  </Flex>
                </Flex>
              )}
              {/* <Button onClick={onClaimCongratsModalOpen}>Show Congrats</Button> */}
              {/* <Button
                // disabled={!switchNetwork || baseGoerli.id === chain?.id}
                key={baseGoerli.id}
                onClick={() => {
                  console.log(baseGoerli.id);
                  switchNetwork?.(baseGoerli.id);
                }}
              >
                Switch to {baseGoerli.name}
                {isLoading &&
                  pendingChainId === baseGoerli.id &&
                  " (switching)"}
              </Button> */}
            </VStack>
          </Flex>
        </Flex>

        {/* Footer */}
        {/* <Flex>
          <Text fontSize="lg">
            {chain && <div>Connected to {chain.name}</div>}
          </Text>
        </Flex>
        <Flex>
          <Text fontSize="lg">{bns}.base</Text>
        </Flex>
        <Flex>
          <Input
            placeholder="yourweb3name.base"
            size="lg"
            onChange={handleBnsOnChange}
          />
          <Button colorScheme="green" size="lg" onClick={handleSearch}>
            Search
          </Button>
        </Flex>
        <Flex>
          <Button
            isDisabled={!isConnected}
            colorScheme="green"
            size="lg"
            onClick={handleRegister}
          >
            Register
          </Button>
        </Flex>
        <Flex>
          <Text fontSize="lg">Connected to {address}</Text>
        </Flex>
        <Flex>
          {!isConnected && (
            <Button colorScheme="blue" size="lg" onClick={() => connect()}>
              Connect Wallet
            </Button>
          )}
          {isConnected && (
            <Button colorScheme="blue" size="lg" onClick={() => disconnect()}>
              Disconnect
            </Button>
          )}
        </Flex>

        <Button
          // disabled={!switchNetwork || baseGoerli.id === chain?.id}
          key={baseGoerli.id}
          onClick={() => {
            console.log(baseGoerli.id);
            switchNetwork?.(baseGoerli.id);
          }}
        >
          Switch to {baseGoerli.name}
          {isLoading && pendingChainId === baseGoerli.id && " (switching)"}
        </Button> */}
      </Flex>
    </>
  );
}
