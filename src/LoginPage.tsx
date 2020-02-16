import React from "react";
import { useLogin } from "react-admin";
import { Button, Card, Container } from "@material-ui/core";
import { ThemeProvider, ThemeProviderProps } from "@material-ui/styles";

const LoginPage = ({ theme }: ThemeProviderProps) => {
  const login = useLogin();
  return (
    <ThemeProvider theme={theme}>
      <Container>
        <Card
          style={{
            height: "90vh",
            marginTop: "5vh",
            display: "flex",
            justifyContent: "center"
          }}
        >
          <Button style={{ width: "100%" }} onClick={() => login()}>
            Login
          </Button>
        </Card>
      </Container>
    </ThemeProvider>
  );
};

export default LoginPage;
