import React, { useEffect, useState } from "react";
import { Container, Menu, Dropdown, MenuItem } from "semantic-ui-react";
import Head from "next/head";

import { Link } from "../routes";
import AssetDisplayComponent from "../components/asset-display";

const Networks = [
  {
    key: "Moonbeam",
    text: "Moonbeam",
    value: "moonbeam",
    image: { avatar: true, src: "moonbeam.png" },
  },
  {
    key: "Moonriver",
    text: "Moonriver",
    value: "moonriver",
    image: { avatar: true, src: "moonriver.png" },
  },
  {
    key: "Moonbase Alpha",
    text: "Moonbase Alpha",
    value: "moonbase",
    image: { avatar: true, src: "moonbase.png" },
  },
];

const MintalbeXC20Dashboard = () => {
  const [network, setNetwork] = useState("moonbeam");
  const [networkName, setNetworkName] = useState("Moonbeam");

  useEffect(() => {
    let networkName = network;
    if (network === "moonbase") {
      networkName = network + " Alpha";
    }
    setNetworkName(networkName[0].toUpperCase() + networkName.slice(1));
  }, [network]);

  const handleChange = (e, { value }) => {
    setNetwork(value);
  };

  return (
    <Container>
      <Head>
        <title>XC-20s Dashboard</title>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link
          rel="stylesheet"
          href="//cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css"
        />
      </Head>
      <div style={{ paddingTop: "10px" }}></div>
      <Menu>
        <Link route="/">
          <a className="item">Mintable XC-20s Dashboard</a>
        </Link>
        <Menu.Item position="right">
          <Dropdown
            placeholder="Select Network"
            selection
            options={Networks}
            onChange={handleChange}
            defaultValue={Networks[0].value}
          />
        </Menu.Item>
      </Menu>
      <br />
      <AssetDisplayComponent network={network} />
      <p>
        Don't judge the code :) as it is for demostration purposes only. You can check the source
        code &nbsp;
        <a href="https://github.com/albertov19/localAsset-dashboard">here</a>
      </p>
      <br />
    </Container>
  );
};

export default MintalbeXC20Dashboard;
