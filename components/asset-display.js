import React, { useState, useEffect } from "react";
import { Form, Container, Message, Table, Loader, Dropdown, Grid } from "semantic-ui-react";
import * as ethers from "ethers";
import { subProvider } from "../web3/api";
import { bnToHex } from "@polkadot/util";

const assetInfoComponent = ({ network }) => {
  const [assets, setAssets] = useState(Array());
  const [assetsDropdown, setAssetsDropdown] = useState(Array());
  const [focusAsset, setFocusAsset] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFocusAsset("");
    loadAllData();
  }, [network]);

  const loadAllData = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      let assetsData = Array();
      let assetsDataDropdown = Array();

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
        const metadata = await api.query.localAssets.metadata(assetsData[i].assetID.toString());
        assetsData[i].address = ethers.utils.getAddress(
          "fffffffe" + bnToHex(assetsData[i].assetID).slice(2)
        );
        assetsData[i].name = metadata.name.toHuman().toString();
        assetsData[i].decimals = metadata.decimals.toHuman().toString();
        assetsData[i].symbol = metadata.symbol.toHuman().toString();
        assetsData[i].metadata = metadata;
        assetsDataDropdown.push({
          key: assetsData[i].assetID,
          text: assetsData[i].name + " - " + assetsData[i].address,
          value: assetsData[i].assetID,
        });
      }

      setAssets(assetsData);
      setAssetsDropdown(assetsDataDropdown);
      setLoading(false);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };
  const renderAssets = () => {
    const { Row, Cell } = Table;
    if (assets.length !== 0) {
      return assets.map((asset, index) => {
        return (
          <Row key={index}>
            <Cell>{index}</Cell>
            <Cell>{asset.name}</Cell>
            <Cell>{asset.symbol}</Cell>
            <Cell>{asset.address}</Cell>
            <Cell>{asset.decimals}</Cell>
            <Cell>{asset.assetID.toString()}</Cell>
          </Row>
        );
      });
    }
  };

  const handleChange = (e, { value }) => {
    console.log(value);
    setFocusAsset(value);
  };

  const renderAsset = () => {
    const { Row, Cell } = Table;
    let focussedAsset;
    if (focusAsset.length !== 0) {
      assets.forEach((asset) => {
        if (asset.assetID === focusAsset) {
          focussedAsset = asset;
        }
      });
      console.log(focussedAsset);
      return (
        <div>
          <Row>
            <Cell>Owner</Cell>
            <Cell>{focussedAsset.assetInfo.toHuman().owner}</Cell>
          </Row>
          <Row>
            <Cell>Issuer</Cell>
            <Cell>{focussedAsset.assetInfo.toHuman().issuer}</Cell>
          </Row>
          <Row>
            <Cell>Admin</Cell>
            <Cell>{focussedAsset.assetInfo.toHuman().admin}</Cell>
          </Row>
          <Row>
            <Cell>Freezer</Cell>
            <Cell>{focussedAsset.assetInfo.toHuman().freezer}</Cell>
          </Row>
          <Row>
            <Cell>Supply</Cell>
            <Cell>{focussedAsset.assetInfo.toHuman().supply}</Cell>
          </Row>
          <Row>
            <Cell>Deposit</Cell>
            <Cell>{focussedAsset.assetInfo.toHuman().deposit}</Cell>
          </Row>
          <Row>
            <Cell>Min. Balance</Cell>
            <Cell>{focussedAsset.assetInfo.toHuman().minBalance}</Cell>
          </Row>
          <Row>
            <Cell>Accounts</Cell>
            <Cell>{focussedAsset.assetInfo.toHuman().accounts}</Cell>
          </Row>
          <Row>
            <Cell>Approvals</Cell>
            <Cell>{focussedAsset.assetInfo.toHuman().approvals}</Cell>
          </Row>
        </div>
      );
    }
  };

  const { Header, Row, HeaderCell, Body, Column } = Table;

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
                  <HeaderCell>Symbol</HeaderCell>
                  <HeaderCell>XC-20 Address</HeaderCell>
                  <HeaderCell>Decimals</HeaderCell>
                  <HeaderCell>Asset ID</HeaderCell>
                </Row>
              </Header>
              <Body>{renderAssets()}</Body>
            </Table>
          </Container>
        )}
        <br />
        <h3> Local Asset Info</h3>
        <Grid>
          <Grid.Column width={8}>
            <Dropdown
              placeholder="Select Asset"
              selection
              options={assetsDropdown}
              onChange={handleChange}
            />
            <br />
            <br />

            <Container>
              <Table definition>
                <Body>{renderAsset()}</Body>
              </Table>
            </Container>
          </Grid.Column>
        </Grid>
        <br />
        <br />
        <Message error header="Oops!" content={errorMessage} />
      </Form>
    </div>
  );
};

export default assetInfoComponent;
