import React, { useState, useEffect } from 'react';

import { Form, Container, Message, Table, Loader, Dropdown, Grid } from 'semantic-ui-react';
import * as ethers from 'ethers';
import { subProvider } from '../web3/api';
import { bnToHex } from '@polkadot/util';
import _ from 'underscore';

const assetInfoComponent = ({ network }) => {
  const [localAssets, setLocalAssets] = useState(Array());
  const [externalAssets, setExternalAssets] = useState(Array());
  const [focusLocalAsset, setFocusLocalAsset] = useState('');
  const [focusExternalAsset, setFocusExternalAsset] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalAssets(Array());
    setExternalAssets(Array());
    setFocusLocalAsset('');
    setFocusExternalAsset('');
    loadAllData('assets');
    loadAllData('localAssets');
  }, [network]);

  const loadAllData = async (pallet) => {
    setLoading(true);
    setErrorMessage('');

    try {
      let assetsData = Array();

      // Load Provider
      const api = await subProvider(network);

      const data = await api.query[pallet].asset.entries();
      data.forEach(async ([key, exposure]) => {
        assetsData.push({
          assetID: BigInt(key.args.map((k) => k.toHuman())[0].replaceAll(',', '')),
          assetInfo: exposure,
        });
      });

      for (let i = 0; i < assetsData.length; i++) {
        let metadata;
        let multilocation;
        if (pallet === 'assets') {
          // Load External Assets asycnhronously all data
          const dataPromise = Promise.all([
            api.query.assetManager.assetIdType(assetsData[i].assetID.toString()),
            api.query[pallet].metadata(assetsData[i].assetID.toString()),
          ]);

          [multilocation, metadata] = await dataPromise;
          multilocation = multilocation.toHuman();

          // Get Parachain ID
          const key = Object.keys(multilocation.Xcm.interior)[0];
          assetsData[i].paraID = multilocation.Xcm.interior[key].Parachain
            ? Number(multilocation.Xcm.interior[key].Parachain.replaceAll(',', ''))
            : multilocation.Xcm.interior[key][0].Parachain
            ? Number(multilocation.Xcm.interior[key][0].Parachain.replaceAll(',', ''))
            : 0;

          // Calculate Address
          assetsData[i].address = ethers.utils.getAddress('ffffffff' + bnToHex(assetsData[i].assetID).slice(2));

          assetsData[i].isLocal = false;
        } else {
          // Load Local Asset asycnhronously all data
          const dataPromise = Promise.all([api.query[pallet].metadata(assetsData[i].assetID.toString())]);

          [metadata] = await dataPromise;

          // Calculate Address
          assetsData[i].address = ethers.utils.getAddress('fffffffe' + bnToHex(assetsData[i].assetID).slice(2));
          assetsData[i].isLocal = true;
        }

        assetsData[i].name = metadata.name.toHuman().toString();
        assetsData[i].decimals = metadata.decimals.toHuman().toString();
        assetsData[i].symbol = metadata.symbol.toHuman().toString();
        assetsData[i].metadata = metadata;
      }

      //sortedAssets.unshift(sortedAssets.pop());

      switch (pallet) {
        case 'localAssets':
          setLocalAssets(assetsData);
          break;
        case 'assets':
          let sortedAssets = _.sortBy(assetsData, 'paraID');
          sortedAssets[0].paraID = 'Relay';

          setExternalAssets(sortedAssets);
          break;
        default:
          throw new Error('Option not allowed!');
      }

      setLoading(false);
    } catch (err) {
      setErrorMessage(err.message);
    }
  };

  const renderAssets = (assetType) => {
    const { Row, Cell } = Table;
    let assetData;
    switch (assetType) {
      case 'local':
        assetData = localAssets;
        break;
      case 'external':
        assetData = externalAssets;
        break;
      default:
        console.error('Option not allowed!');
    }
    if (assetData.length !== 0 && assetData[0]) {
      return assetData.map((asset, index) => {
        return (
          <Row
            key={index}
            onClick={() => {
              handleClick(asset);
            }}
          >
            <Cell>{index + 1}</Cell>
            <Cell>{asset.name}</Cell>
            <Cell>{asset.symbol}</Cell>
            <Cell>{asset.address}</Cell>
            <Cell>{asset.decimals}</Cell>
            <Cell>{asset.assetID.toString()}</Cell>
            {assetType === 'external' && <Cell>{asset.paraID}</Cell>}
          </Row>
        );
      });
    }
  };

  const handleClick = (asset) => {
    if (asset.isLocal) {
      setFocusLocalAsset(asset);
    } else {
      setFocusExternalAsset(asset);
    }
  };

  const renderAsset = (assetType) => {
    const { Row, Cell } = Table;
    let focussedAsset;
    switch (assetType) {
      case 'local':
        focussedAsset = focusLocalAsset;
        break;
      case 'external':
        focussedAsset = focusExternalAsset;
        break;
      default:
        console.error('Option not allowed!');
    }
    if (focussedAsset) {
      return (
        <Body>
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
            <Cell>Supply (raw)</Cell>
            <Cell>{`${focussedAsset.assetInfo.toHuman().supply} `}</Cell>
          </Row>
          <Row>
            <Cell>Supply</Cell>
            <Cell>{`${
              focussedAsset.assetInfo.toHuman().supply.replaceAll(',', '') / Math.pow(10, focussedAsset.decimals)
            } ${focussedAsset.symbol}`}</Cell>
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
            <Cell>Sufficients</Cell>
            <Cell>{focussedAsset.assetInfo.toHuman().sufficients}</Cell>
          </Row>
          <Row>
            <Cell>Approvals</Cell>
            <Cell>{focussedAsset.assetInfo.toHuman().approvals}</Cell>
          </Row>
        </Body>
      );
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
        {loading === true && <Loader active inline='centered' content='Loading' />}
        {loading === false && (
          <Container>
            <Table singleLine selectable color='teal'>
              <Header>
                <Row>
                  <HeaderCell>#</HeaderCell>
                  <HeaderCell>Asset Name</HeaderCell>
                  <HeaderCell>Symbol</HeaderCell>
                  <HeaderCell>XC-20 Address</HeaderCell>
                  <HeaderCell>Decimals</HeaderCell>
                  <HeaderCell>Asset ID</HeaderCell>
                  <HeaderCell>Para-ID</HeaderCell>
                </Row>
              </Header>
              <Body>{renderAssets('external')}</Body>
            </Table>
          </Container>
        )}
        <h2> Local XC-20s</h2>
        <p>
          <i>Click on the External Asset to get more Info</i>
        </p>
        <br />
        {loading === true && <Loader active inline='centered' content='Loading' />}
        {loading === false && (
          <Container>
            <Table singleLine selectable color='pink'>
              <Header>
                <Row>
                  <HeaderCell>#</HeaderCell>
                  <HeaderCell>Asset Name</HeaderCell>
                  <HeaderCell>Symbol</HeaderCell>
                  <HeaderCell>XC-20 Address</HeaderCell>
                  <HeaderCell>Decimals</HeaderCell>
                  <HeaderCell>Asset ID</HeaderCell>
                </Row>
              </Header>
              <Body>{renderAssets('local')}</Body>
            </Table>
          </Container>
        )}
        <br />
        <hr />
        <br />
        <Grid>
          <Grid.Column width={8}>
            {focusExternalAsset ? (
              <Container>
                <h3> External Asset Info</h3>
                <Table definition singleLine color='teal'>
                  {renderAsset('external')}
                </Table>
              </Container>
            ) : (
              ''
            )}
          </Grid.Column>
          <Grid.Column width={8}>
            {focusLocalAsset ? (
              <Container>
                <h3> Local Asset Info</h3>
                <Table definition singleLine color='pink'>
                  {renderAsset('local')}
                </Table>
              </Container>
            ) : (
              ''
            )}
          </Grid.Column>
        </Grid>
        <br />
        <br />
        <Message error header='Oops!' content={errorMessage} />
      </Form>
    </div>
  );
};

export default assetInfoComponent;
