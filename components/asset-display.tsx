import React, { useState, useEffect } from "react";
import {
  Form,
  Container,
  Message,
  Table,
  Loader,
  Modal,
  Button,
  Icon,
} from "semantic-ui-react";
import * as ethers from "ethers";
import { subProvider } from "../web3/api";
import ERC20ABI from "../web3/ERC20ABI.json";
import _ from "underscore";

const assetInfoComponent = ({ network, loading, setLoading }) => {
  const [externalAssets, setExternalAssets] = useState([]);
  const [focussedAsset, setFocussedAsset] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = async (e, text, key) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setFocussedAsset(null);
      setModalOpen(false);
      setLoading(true);
      setErrorMessage("");

      try {
        let assetsData = [];
        const [api, ethApi] = await subProvider(network);
        const data = await api.query.evmForeignAssets.assetsById.entries();

        data.forEach(async ([key, exposure]) => {
          assetsData.push({
            assetID: BigInt(
              key.args.map((k) => k.toHuman())[0].replaceAll(",", "")
            ),
            assetInfo: exposure,
          });
        });

        for (let i = 0; i < assetsData.length; i++) {
          let multilocation = assetsData[i].assetInfo.toJSON();
          let relativePrice;
          let name, symbol, decimals, totalSupply, owner;

          const assetAddress = ethers.getAddress(
            ("0x" +
              assetsData[i].assetID.toString(16).padStart(32, "0").padStart(40, "F")).toLowerCase()
          );

          try {
            const contract = new ethers.Contract(
              assetAddress,
              ERC20ABI,
              ethApi
            );

            [name, symbol, decimals, totalSupply, owner] = await Promise.all([
              contract.name(),
              contract.symbol(),
              contract.decimals(),
              contract.totalSupply(),
              contract.owner(),
            ]);

            const rawRelativePrice = (
              await api.query.xcmWeightTrader.supportedAssets(multilocation)
            ).toHuman();
            relativePrice = rawRelativePrice ? rawRelativePrice[1] : "N/A";

            const key = Object.keys(multilocation.interior)[0];
            assetsData[i].paraID = !Array.isArray(multilocation.interior[key])
              ? "Relay"
              : multilocation.interior[key][0].parachain
                ? String(multilocation.interior[key][0].parachain)
                : "Eth";
          } catch (err) {
            console.log("Error fetching contract data:", err.message);
          }

          assetsData[i].address = assetAddress;
          assetsData[i].name = name;
          assetsData[i].decimals = decimals?.toString?.() ?? "0";
          assetsData[i].symbol = symbol?.toString?.() ?? "";
          assetsData[i].owner = owner ?? null;
          assetsData[i].totalSupply = totalSupply ?? null;
          assetsData[i].multilocation = multilocation;
          assetsData[i].relativePrice = relativePrice;
        }

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
    return externalAssets.map((asset, index) => {
      const assetIDStr = asset.assetID.toString();
      return (
        <Row
          key={index}
          onClick={() => {
            setFocussedAsset(asset);
            setModalOpen(true);
          }}
          style={{ cursor: "pointer" }}
        >
          <Cell>{index + 1}</Cell>
          <Cell>{asset.name}</Cell>
          <Cell>{asset.symbol}</Cell>

          <Cell>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5em" }}>
              <span>{asset.address}</span>
              <Button
                icon
                size="mini"
                onClick={(e) => handleCopy(e, asset.address, `address-${index}`)}
                style={{
                  boxShadow: "none",
                  border: "none",
                  background: "none",
                  padding: 0,
                }}
              >
                <Icon name={copiedField === `address-${index}` ? "check" : "copy"} color={copiedField === `address-${index}` ? "green" : null} />
              </Button>
            </div>
          </Cell>

          <Cell>{asset.decimals}</Cell>

          <Cell>
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5em" }}>
              <span>{assetIDStr}</span>
              <Button
                icon
                size="mini"
                onClick={(e) => handleCopy(e, assetIDStr, `id-${index}`)}
                style={{
                  boxShadow: "none",
                  border: "none",
                  background: "none",
                  padding: 0,
                }}
              >
                <Icon name={copiedField === `id-${index}` ? "check" : "copy"} color={copiedField === `id-${index}` ? "green" : null} />
              </Button>
            </div>
          </Cell>

          <Cell>{asset.relativePrice !== "N/A" ? "✔️" : "❌"}</Cell>
          <Cell>{asset.paraID}</Cell>
        </Row>
      );
    });
  };

  const renderAssetModal = () => {
    if (!focussedAsset) return null;
    const humanInfo = focussedAsset.assetInfo?.toHuman?.() ?? {};
    const supplyRaw =
      focussedAsset.totalSupply?.toString?.() ??
      humanInfo.supply ?? "N/A";
    const cleanedSupply = supplyRaw.replaceAll?.(",", "") ?? "";
    const displaySupply =
      cleanedSupply && !isNaN(cleanedSupply)
        ? `${parseFloat(cleanedSupply) / Math.pow(10, parseInt(focussedAsset.decimals || "0"))} ${focussedAsset.symbol}`
        : "N/A";

    let formattedRelativePrice = "N/A";
    if (Array.isArray(focussedAsset.relativePrice)) {
      formattedRelativePrice = focussedAsset.relativePrice
        .map((val) => val.toString().replaceAll(",", ""))
        .join(" | ");
    } else if (typeof focussedAsset.relativePrice === "string") {
      formattedRelativePrice = focussedAsset.relativePrice.replaceAll(",", "");
    } else if (typeof focussedAsset.relativePrice === "object") {
      formattedRelativePrice = JSON.stringify(focussedAsset.relativePrice).replaceAll(",", "");
    }

    return (
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} closeIcon>
        <Modal.Header>External Asset Info</Modal.Header>
        <Modal.Content scrolling>
          <Table definition singleLine color="teal" size="small">
            <Table.Body>
              <Table.Row>
                <Table.Cell>Multilocation</Table.Cell>
                <Table.Cell style={{ wordBreak: "break-word" }}>
                  {JSON.stringify(focussedAsset.multilocation)}
                </Table.Cell>
              </Table.Row>
              <Table.Row><Table.Cell>Name</Table.Cell><Table.Cell>{focussedAsset.name ?? "N/A"}</Table.Cell></Table.Row>
              <Table.Row><Table.Cell>Symbol</Table.Cell><Table.Cell>{focussedAsset.symbol ?? "N/A"}</Table.Cell></Table.Row>
              <Table.Row><Table.Cell>Decimals</Table.Cell><Table.Cell>{focussedAsset.decimals ?? "N/A"}</Table.Cell></Table.Row>
              <Table.Row><Table.Cell>Owner</Table.Cell><Table.Cell>{focussedAsset.owner ?? humanInfo.owner ?? "N/A"}</Table.Cell></Table.Row>
              <Table.Row><Table.Cell>Supply (raw)</Table.Cell><Table.Cell>{supplyRaw}</Table.Cell></Table.Row>
              <Table.Row><Table.Cell>Supply</Table.Cell><Table.Cell>{displaySupply}</Table.Cell></Table.Row>
              <Table.Row><Table.Cell>Relative Price (raw)</Table.Cell><Table.Cell>{formattedRelativePrice}</Table.Cell></Table.Row>
            </Table.Body>
          </Table>
        </Modal.Content>
      </Modal>
    );
  };

  const { Header, Row, HeaderCell, Body } = Table;

  return (
    <div>
      <Form error={!!errorMessage}>
        <h2>External XC-20s</h2>
        <p><i>Click on the External Asset to get more Info</i></p>
        {loading ? (
          <Loader active inline="centered" content="Loading" />
        ) : (
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
        {renderAssetModal()}
        <br />
        <Message error header="Oops!" content={errorMessage} />
      </Form>
    </div>
  );
};

export default assetInfoComponent;
