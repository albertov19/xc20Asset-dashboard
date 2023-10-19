const { ApiPromise, WsProvider } = require("@polkadot/api");
declare let ethereum: any;

export async function subProvider(network) {
  const chains = {
    moonbase: {
      ws: "wss://moonbase.unitedbloc.com",
    },
    moonriver: {
      ws: "wss://moonriver.unitedbloc.com",
    },
    moonbeam: {
      ws: "wss://moonbeam.unitedbloc.com",
    },
  };

  // Create WS Provider
  const wsProvider = new WsProvider(chains[network].ws);

  // Wait for Provider
  const api = await ApiPromise.create({
    provider: wsProvider,
    noInitWarn: true,
  });
  await api.isReady;
  return api;
}
