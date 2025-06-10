import React, { useState, useEffect } from "react";
import {
  Form,
  Container,
  Message,
  Table,
  Loader,
  Grid,
} from "semantic-ui-react";
import * as ethers from "ethers";
import { subProvider } from "../web3/api";
import { bnToHex } from "@polkadot/util";
import ERC20ABI from "../web3/ERC20ABI.json";
import _ from "underscore";

const assetInfoComponent = ({ network, loading, setLoading }) => {
  const [externalAssets, setExternalAssets] = useState(Array());
  const [focussedAsset, setFocussedAsset] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadAllData = async () => {
      setFocussedAsset(null);
      setLoading(true);
      setErrorMessage("");

      try {
        let assetsData = Array();

        // Load Polkadot and Ethereum API Provider
        const [api, ethApi] = await subProvider(network);

        // Get all assets
        const data = await api.query.evmForeignAssets.assetsById.entries();
        data.forEach(async ([key, exposure]) => {
          assetsData.push({
            assetID: BigInt(
              key.args.map((k) => k.toHuman())[0].replaceAll(",", "")
            ),
            assetInfo: exposure,
          });
        });

        // Go through each asset
        for (let i = 0; i < assetsData.length; i++) {
          let multilocation = assetsData[i].assetInfo.toJSON();
          let relativePrice;
          let name, symbol, decimals, totalSupply;

          // Get Asset ERC-20 Address
          const assetAddress = ethers.getAddress(
            (
              "0x" + assetsData[i].assetID.toString(16).padStart(40, "F")
            ).toLowerCase()
          );

          try {
            // Load Asset Details via ERC-20 ABI
            const contract = new ethers.Contract(
              assetAddress,
              ERC20ABI,
              ethApi
            );

            // Batch RPC to ERC-20 Contract
            [name, symbol, decimals, totalSupply] = await Promise.all([
              contract.name(),
              contract.symbol(),
              contract.decimals(),
              contract.totalSupply(),
            ]);


            // Get Relative Prize
            const rawRelativePrice = (
              await api.query.xcmWeightTrader.supportedAssets(multilocation)
            ).toHuman();
            relativePrice = rawRelativePrice ? rawRelativePrice[1] : "N/A";

            console.log(assetsData[i].assetID.toString(), relativePrice);

            // Get Parachain ID
            const key = Object.keys(multilocation.interior)[0];
            assetsData[i].paraID = !Array.isArray(multilocation.interior[key])
              ? "Relay"
              : multilocation.interior[key][0].parachain
              ? String(multilocation.interior[key][0].parachain)
              : "Eth";
          } catch (err) {
            console.log(err.message);
          }

          // Gather all data
          assetsData[i].address = assetAddress;
          assetsData[i].name = name;
          assetsData[i].decimals = decimals.toString();
          assetsData[i].symbol = symbol.toString();
          assetsData[i].multilocation = multilocation;
          assetsData[i].relativePrice = relativePrice;
        }

        // Sort Results
        let sortedAssets = _.sortBy(assetsData, "paraID");

        setExternalAssets(sortedAssets);
      } catch (err) {
        setErrorMessage(err.message);
      }

      setLoading(false);
    };

    loadAllData();
  }, [network]);

  const renderAssets = () => {
    const { Row, Cell } = Table;
    if (externalAssets.length !== 0 && externalAssets[0]) {
      return externalAssets.map((asset, index) => {
        return (
          <Row
            key={index}
            onClick={() => {
              setFocussedAsset(asset);
            }}
          >
            <Cell>{index + 1}</Cell>
            <Cell>{asset.name}</Cell>
            <Cell>{asset.symbol}</Cell>
            <Cell>{asset.address}</Cell>
            <Cell>{asset.decimals}</Cell>
            <Cell>{asset.assetID.toString()}</Cell>
            <Cell>{asset.relativePrice != "N/A" ? "✔️" : "❌"}</Cell>
            <Cell>{asset.paraID}</Cell>
          </Row>
        );
      });
    }
  };

  const renderAsset = () => {
    const { Row, Cell } = Table;

    if (focussedAsset && Object.keys(focussedAsset).length > 0) {
      return (
        <Container>
          <br />
          <hr />
          <h3> External Asset Info</h3>
          <Table definition singleLine color="teal" size="small">
            <Body>
              <Row>
                <Cell>Multilocation</Cell>
                <Cell
                  style={{
                    maxWidth: 8,
                    wordWrap: "break-word",
                    whiteSpace: "normal",
                    overflowWrap: "anywhere",
                  }}
                >
                  {JSON.stringify(focussedAsset.multilocation)}
                </Cell>
              </Row>
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
                <Cell>Is Sufficient?</Cell>
                <Cell>
                  {focussedAsset.assetInfo.toHuman().isSufficient ? "✔️" : "❌"}
                </Cell>
              </Row>
              <Row>
                <Cell>Supply (raw)</Cell>
                <Cell>{`${focussedAsset.assetInfo.toHuman().supply} `}</Cell>
              </Row>
              <Row>
                <Cell>Supply</Cell>
                <Cell>{`${
                  focussedAsset.assetInfo.toHuman().supply.replaceAll(",", "") /
                  Math.pow(10, focussedAsset.decimals)
                } ${focussedAsset.symbol}`}</Cell>
              </Row>
              <Row>
                <Cell>Relative Price</Cell>
                <Cell>{`${focussedAsset.relativePrice}`}</Cell>
              </Row>
              <Row>
                <Cell>Accounts</Cell>
                <Cell>{focussedAsset.assetInfo.toHuman().accounts}</Cell>
              </Row>
              <Row>
                <Cell>Sufficients</Cell>
                <Cell>{focussedAsset.assetInfo.toHuman().sufficients}</Cell>
              </Row>
              <Row>
                <Cell>Approvals</Cell>
                <Cell>{focussedAsset.assetInfo.toHuman().approvals}</Cell>
              </Row>
              <Row>
                <Cell>Min. Balance</Cell>
                <Cell>{focussedAsset.assetInfo.toHuman().minBalance}</Cell>
              </Row>
              <Row>
                <Cell>Deposit</Cell>
                <Cell>{focussedAsset.assetInfo.toHuman().deposit}</Cell>
              </Row>
            </Body>
          </Table>
        </Container>
      );
    } else {
      return null;
    }
  };

  const { Header, Row, HeaderCell, Body } = Table;

  return (
    <div>
      <Form error={!!{ errorMessage }.errorMessage}>
        <h2>External XC-20s</h2>
        <p>
          <i>Click on the External Asset to get more Info</i>
        </p>
        {loading === true && (
          <Loader active inline="centered" content="Loading" />
        )}
        {loading === false && (
          <Container>
            <div style={{ overflowX: "auto" }}>
              <Table size="small" singleLine selectable color="teal">
                <Header>
                  <Row>
                    <HeaderCell>#</HeaderCell>
                    <HeaderCell>Asset Name</HeaderCell>
                    <HeaderCell>Symbol</HeaderCell>
                    <HeaderCell>XC-20 Address</HeaderCell>
                    <HeaderCell>Dec.</HeaderCell>
                    <HeaderCell>Asset ID</HeaderCell>
                    <HeaderCell>Fee?</HeaderCell>
                    <HeaderCell>ParaID</HeaderCell>
                  </Row>
                </Header>
                <Body>{renderAssets()}</Body>
              </Table>
            </div>
          </Container>
        )}

        <Grid>
          <Grid.Column width={8}>
            {focussedAsset ? renderAsset() : ""}
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
