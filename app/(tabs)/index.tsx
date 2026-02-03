import { Redirect } from "expo-router";
import React from "react";

const index = () => {
  return <Redirect href={"/(auth)/signup"} />;
};

export default index;
