// Copyright (c) 2020-2021 Drew Lemmy
// This file is part of KristWeb 2 under GPL-3.0.
// Full details: https://github.com/tmpim/KristWeb2/blob/master/LICENSE.txt
import React from "react";
import { Button } from "antd";
import { SendOutlined, SwapOutlined, UserAddOutlined, EditOutlined } from "@ant-design/icons";

import { useTranslation } from "react-i18next";

import { KristAddressWithNames } from "../../krist/api/lookup";
import { useWallets } from "../../krist/wallets/Wallet";
import { WalletEditButton } from "../wallets/WalletEditButton";

export function AddressButtonRow({ address }: { address: KristAddressWithNames }): JSX.Element {
  const { t } = useTranslation();
  const { wallets } = useWallets();

  const myWallet = Object.values(wallets)
    .find(w => w.address === address.address);

  return <>
    {/* Send/transfer Krist button */}
    {myWallet
      ? (
        <Button type="primary" icon={<SwapOutlined />}>
          {t("address.buttonTransferKrist", { address: address.address })}
        </Button>
      )
      : (
        <Button type="primary" icon={<SendOutlined />}>
          {t("address.buttonSendKrist", { address: address.address })}
        </Button>
      )}

    {/* Add friend/edit wallet button */}
    {/* TODO: Change this to edit if they're already a friend */}
    {myWallet
      ? (
        <WalletEditButton wallet={myWallet}>
          <Button icon={<EditOutlined />}>{t("address.buttonEditWallet")}</Button>
        </WalletEditButton>
      )
      : (
        <Button icon={<UserAddOutlined />}>
          {t("address.buttonAddFriend")}
        </Button>
      )}
  </>;
}
