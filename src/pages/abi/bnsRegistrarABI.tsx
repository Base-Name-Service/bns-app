export const bnsRegistrarABI = [
  {
    inputs: [
      { internalType: "contract ENS", name: "ensAddr", type: "address" },
      { internalType: "bytes32", name: "node", type: "bytes32" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      { internalType: "bytes32", name: "label", type: "bytes32" },
      { internalType: "address", name: "owner", type: "address" },
    ],
    name: "register",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
