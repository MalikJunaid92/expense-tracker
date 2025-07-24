import ScreenWrapper from "@/components/ScreenWrapper";
import { useAuth } from "@/contexts/authContext";
import { Header } from "@react-navigation/elements";
import React from "react";
import { StyleSheet } from "react-native";

const Home = () => {
  const { user } = useAuth();
  // const handleLogout = async () => {
  //   await signOut(auth);
  // };
  return (
    <ScreenWrapper>
      <Header title="Home" />
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({});
