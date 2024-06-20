import React, { useState, useEffect } from 'react';
import { Container, Menu, Dropdown, MenuItem } from 'semantic-ui-react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AssetDisplayComponent from '../components/asset-display';

const Networks = [
  {
    key: 'Moonbeam',
    text: 'Moonbeam',
    value: 'moonbeam',
    image: { avatar: true, src: 'moonbeam.png' },
  },
  {
    key: 'Moonriver',
    text: 'Moonriver',
    value: 'moonriver',
    image: { avatar: true, src: 'moonriver.png' },
  },
  {
    key: 'Moonbase Alpha',
    text: 'Moonbase Alpha',
    value: 'moonbase',
    image: { avatar: true, src: 'moonbase.png' },
  },
];

const MintableXC20Dashboard = () => {
  const router = useRouter();

  const [network, setNetwork] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set the Intial State of the Network based on Default Param or Route
    const { network: networkQueryParam } = router.query;
    if (!networkQueryParam && router.isReady) {
      handleChange(null, Networks[0]);
    }

    if (router.query.network && network !== router.query.network) {
      setNetwork((router.query.network as string).toLocaleLowerCase());
    }
  }, [router.query.network]);

  const handleChange = (e, { value }) => {
    // Update the URL query param when the dropdown selection changes
    router.push(`/?network=${value}`);

    setNetwork(value);
  };

  return (
    <div
      style={{
        paddingLeft: '20px',
        paddingRight: '20px',
        paddingTop: '10px',
        overflowX: 'auto',
      }}
    >
      <Container>
        <Head>
          <title>XC-20s Dashboard</title>
          <link rel='icon' type='image/png' sizes='32x32' href='/favicon.png' />
          <link
            rel='stylesheet'
            href='//cdn.jsdelivr.net/npm/semantic-ui@2.4.2/dist/semantic.min.css'
          />
        </Head>
        <Menu>
          <Link href='/'>
            <a className='item'>XC-20s Dashboard</a>
          </Link>
          <Menu.Item position='right'>
            <Dropdown
              placeholder='Select Network'
              selection
              options={Networks}
              onChange={handleChange}
              value={network}
              disabled={loading}
            />
          </Menu.Item>
        </Menu>
        <br />
        {network ? (
          network == 'moonbeam' ||
          network == 'moonriver' ||
          network == 'moonbase' ? (
            <AssetDisplayComponent
              network={network}
              loading={loading}
              setLoading={setLoading}
            />
          ) : (
            <h3>Network must be Moonbeam, Moonriver, or Moonbase</h3>
          )
        ) : (
          ''
        )}
        <p>
          Don't judge the code :) as it is for demonstration purposes only. You
          can check the source code &nbsp;
          <a href='https://github.com/albertov19/localAsset-dashboard'>here</a>
        </p>
        <br />
      </Container>
    </div>
  );
};

export default MintableXC20Dashboard;
