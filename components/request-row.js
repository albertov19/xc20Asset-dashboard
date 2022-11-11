import React, { useState } from "react";
import { Table, Button } from "semantic-ui-react";
import stakingInstance from "../web3/staking";

const RequestRow = ({ request }) => {
  // Initial State
  const [loading, setLoading] = useState();

  const executeRevoke = async () => {
    setLoading(true);

    let stakingInterface = stakingInstance();

    try {
      await stakingInterface.execute_delegation_request(request.delegator, request.collator);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      console.error(err.message);
    }
  };

  const { Row, Cell } = Table;

  return (
    <Row key={request.delegator}>
      <Cell>{request.delegator}</Cell>
      <Cell>{request.amount.replaceAll(",", "") / 10 ** 18}</Cell>
      <Cell>{request.top.toString()}</Cell>
      <Cell>{request.round}</Cell>
      <Cell>{request.executable.toString()}</Cell>
      <Cell>
        <Button
          color="orange"
          disabled={!request.executable}
          loading={loading}
          onClick={executeRevoke}
        >
          {" "}
          Execute{" "}
        </Button>
      </Cell>
    </Row>
  );
};

export default RequestRow;
