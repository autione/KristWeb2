// Copyright (c) 2020-2021 Drew Lemmy
// This file is part of KristWeb 2 under GPL-3.0.
// Full details: https://github.com/tmpim/KristWeb2/blob/master/LICENSE.txt
import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Table } from "antd";

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { KristTransaction } from "../../krist/api/types";
import { lookupTransactions, LookupTransactionsOptions, LookupTransactionsResponse, LookupTransactionType } from "../../krist/api/lookup";
import { getTablePaginationSettings, handleLookupTableChange } from "../../utils/table";

import { ListingType } from "./TransactionsPage";

import { TransactionType, TYPES_SHOW_VALUE } from "../../components/transactions/TransactionType";
import { ContextualAddress } from "../../components/addresses/ContextualAddress";
import { KristValue } from "../../components/krist/KristValue";
import { KristNameLink } from "../../components/names/KristNameLink";
import { TransactionConciseMetadata } from "../../components/transactions/TransactionConciseMetadata";
import { DateTime } from "../../components/DateTime";

import Debug from "debug";
const debug = Debug("kristweb:transactions-table");

// Received 'Cannot access LookupTransactionType before initialization' here,
// this is a crude workaround
const LISTING_TYPE_MAP: Record<ListingType, LookupTransactionType> = {
  [0]: LookupTransactionType.TRANSACTIONS,
  [1]: LookupTransactionType.TRANSACTIONS,
  [2]: LookupTransactionType.TRANSACTIONS,
  [3]: LookupTransactionType.NAME_HISTORY,
  [4]: LookupTransactionType.NAME_TRANSACTIONS
};

interface Props {
  listingType: ListingType;

  // Number used to trigger a refresh of the transactions listing
  refreshingID?: number;

  addresses?: string[];
  name?: string;

  includeMined?: boolean;
  setError?: Dispatch<SetStateAction<Error | undefined>>;
}

export function TransactionsTable({ listingType, refreshingID, addresses, name, includeMined, setError }: Props): JSX.Element {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [res, setRes] = useState<LookupTransactionsResponse>();
  const [options, setOptions] = useState<LookupTransactionsOptions>({
    limit: 20,
    offset: 0,
    orderBy: "time", // Equivalent to sorting by ID
    order: "DESC"
  });

  // Fetch the transactions from the API, mapping the table options
  useEffect(() => {
    debug("looking up transactions (type: %d mapped: %d) for %s", listingType, LISTING_TYPE_MAP[listingType], name || (addresses ? addresses.join(",") : "network"));
    setLoading(true);

    lookupTransactions(name ? [name] : addresses, {
      ...options,
      includeMined,
      type: LISTING_TYPE_MAP[listingType]
    })
      .then(setRes)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [listingType, refreshingID, addresses, name, setError, options, includeMined]);

  debug("results? %b  res.transactions.length: %d  res.count: %d  res.total: %d", !!res, res?.transactions?.length, res?.count, res?.total);

  return <Table<KristTransaction>
    className="transactions-table"
    size="small"

    loading={loading}
    dataSource={res?.transactions || []}
    rowKey="id"

    // Triggered whenever the filter, sorting, or pagination changes
    onChange={handleLookupTableChange(setOptions)}
    pagination={getTablePaginationSettings(t, res, "transactions.tableTotal")}

    columns={[
      // ID
      {
        title: t("transactions.columnID"),
        dataIndex: "id", key: "id",

        render: id => (
          <Link to={`/network/transactions/${encodeURIComponent(id)}`}>
            {id.toLocaleString()}
          </Link>
        ),
        width: 100

        // Don't allow sorting by ID to save a bit of width in the columns;
        // it's equivalent to sorting by time anyway
      },
      // Type
      {
        title: t("transactions.columnType"),
        dataIndex: "type", key: "type",
        render: (_, tx) => <TransactionType transaction={tx} />
      },

      // From
      {
        title: t("transactions.columnFrom"),
        dataIndex: "from", key: "from",

        render: (from, tx) => from && tx.type !== "mined" && (
          <ContextualAddress
            className="transactions-table-address"
            address={from}
            metadata={tx.metadata}
            allowWrap
          />
        ),

        sorter: true
      },
      // To
      {
        title: t("transactions.columnTo"),
        dataIndex: "to", key: "to",

        render: (to, tx) => to && tx.type !== "name_purchase" && tx.type !== "name_a_record" && (
          <ContextualAddress
            className="transactions-table-address"
            address={to}
            metadata={tx.metadata}
            allowWrap
          />
        ),

        sorter: true
      },

      // Value
      {
        title: t("transactions.columnValue"),
        dataIndex: "value", key: "value",

        render: (value, tx) => TYPES_SHOW_VALUE.includes(tx.type) && (
          <KristValue value={value} />
        ),
        width: 100,

        sorter: true
      },

      // Name
      {
        title: t("transactions.columnName"),
        dataIndex: "name", key: "name",

        render: name => <KristNameLink name={name} />,

        sorter: true
      },

      // Metadata
      {
        title: t("transactions.columnMetadata"),
        dataIndex: "metadata", key: "metadata",

        render: (_, transaction) => <TransactionConciseMetadata transaction={transaction} />,
        width: 260
      },

      // Time
      {
        title: t("transactions.columnTime"),
        dataIndex: "time", key: "time",
        render: time => <DateTime date={time} />,
        width: 200,

        sorter: true,
        defaultSortOrder: "descend"
      }
    ]}
  />;
}
