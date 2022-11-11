import React, { useState, useEffect } from "react";
import { Form, Container, Message, Table, Loader } from "semantic-ui-react";
import * as ethers from "ethers";
import { subProvider } from "../web3/api";
import { bnToHex } from "@polkadot/util";

const assetInfoComponent = ({ network }) => {
  const [assets, setAssets] = useState(Array());
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(async () => {
    await loadAllData();
  }, [network]);

  const loadAllData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      let assetsData = Array();
      // Load Provider
      const api = await subProvider(network);

      const data = await api.query.localAssets.asset.entries();
      data.forEach(async ([key, exposure]) => {
        assetsData.push({
          assetID: BigInt(key.args.map((k) => k.toHuman())[0].replaceAll(",", "")),
          assetInfo: exposure,
        });
      });

      for (let i = 0; i < assetsData.length; i++) {
        console.log(assetsData[i]);
        const metadata = await api.query.localAssets.metadata(assetsData[i].assetID.toString());
        assetsData[i].name = metadata.name.toHuman().toString();
        assetsData[i].metadata = metadata;
      }

      setAssets(assetsData);
      setLoading(false);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const renderRows = () => {
    const { Row, Cell } = Table;
    if (assets.length !== 0) {
      return assets.map((asset, index) => {
        const address = ethers.utils.getAddress("fffffffe" + bnToHex(asset.assetID).slice(2));
        return (
          <Row key={index}>
            <Cell>{index}</Cell>
            <Cell>{asset.name}</Cell>
            <Cell>{address}</Cell>
            <Cell>{asset.assetID.toString()}</Cell>
          </Row>
        );
      });
    }
  };

  const { Header, Row, HeaderCell, Body } = Table;

  return (
    <div>
      <Form error={!!{ errorMessage }.errorMessage}>
        <br />
        {loading === true && <Loader active inline="centered" content="Loading" />}
        {loading === false && (
          <Container>
            <Table>
              <Header>
                <Row>
                  <HeaderCell>Asset #</HeaderCell>
                  <HeaderCell>Asset Name</HeaderCell>
                  <HeaderCell>XC-20 Address</HeaderCell>
                  <HeaderCell>Asset ID</HeaderCell>
                </Row>
              </Header>
              <Body>{renderRows()}</Body>
            </Table>
          </Container>
        )}
        <br />
        <Message error header="Oops!" content={errorMessage} />
      </Form>
    </div>
  );
};

export default assetInfoComponent;
