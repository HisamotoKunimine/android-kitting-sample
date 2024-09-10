"use client";
// External libraries
import { Stack } from "@mui/material";
import { NextPage } from "next";
import Head from "next/head";
import React from "react";
import { observer } from "mobx-react-lite";

// Internal modules
import { Connect } from "@/app/connect";
import { Kitting } from "@/app/kitting";

const Install: NextPage = () => {
  return (
    <Stack sx={{ pt: 5, paddingX: 5, maxWidth: 400, m: "auto" }}>
      <Head>
        <title>KittingSample</title>
      </Head>
      <Connect />
      <Kitting />
    </Stack>
  );
};

export default observer(Install);
