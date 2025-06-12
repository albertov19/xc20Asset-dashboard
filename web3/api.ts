const { ApiPromise, WsProvider } = require("@polkadot/api");
import * as ethers from "ethers";

declare let ethereum: any;

export async function subProvider(network) {
  const chains = {
    moonbase: {
      ws: "wss://moonbase.unitedbloc.com",
      https: "https://moonbase.unitedbloc.com",
      chainId: 1287,
    },
    moonriver: {
      ws: "wss://moonriver.unitedbloc.com",
      https: "https://moonriver.unitedbloc.com",
      chainId: 1285,
    },
    moonbeam: {
      ws: "wss://moonbeam.unitedbloc.com",
      https: "https://moonbeam.unitedbloc.com",
      chainId: 1284,
    },
  };

  // Instantiation of Polkadot API
  // Create WS Provider
  const wsProvider = new WsProvider(chains[network].ws);

  // Wait for Provider
  const api = await ApiPromise.create({
    provider: wsProvider,
    noInitWarn: true,
  });
  await api.isReady;

  // Intsantiate Ethereum Provider
  const ethAPI = new ethers.JsonRpcProvider(chains[network].https);

  return [api, ethAPI];
}