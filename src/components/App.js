import React, { Component } from "react";
import Web3 from "web3";
import Color from "../abis/Color.json";
import "./App.css";

export default class App extends Component {
  async componentDidMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3;
    // Load account
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });
    const networkid = await web3.eth.net.getId();
    const networkdata = Color.networks[networkid];
    if (networkdata) {
      const abi = Color.abi;
      const address = networkdata.address;
      const contract = new web3.eth.Contract(abi, address);
      this.setState({ contract });
      const count = await contract.methods.count().call();

      this.setState({ totalSupply: count });
      for (var i = 1; i <= count; i++) {
        const color = await contract.methods.colors(i - 1).call();
        const owner = await contract.methods.owner(i - 1).call();
        this.setState({
          colors: [...this.state.colors, color],
          owners: [...this.state.owners, owner],
        });
      }
    } else {
      window.alert("Smart contract not deployed to detected network");
    }
  }
  constructor(props) {
    super(props);
    this.state = {
      account: "",
      contract: null,
      totalSupply: 0,
      colors: [],
      owners: [],
      auction:[]
    };
  }
  mint = (color) => {
    this.state.contract.methods
      .mint(color)
      .send({ from: this.state.account })
      .once("receipt", (receipt) => {
        this.setState({
          colors: [...this.state.colors, color],
        });
      });
  };
  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            rel="noopener noreferrer"
          >
            Color Tokens
          </a>
          <a
            className="navbar-brand"
            href={"https://etherscan.io/address/" + this.state.account}
            target="_blank"
          >
            {" "}
            {this.state.account}{" "}
          </a>
        </nav>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <h1>Issue Token</h1>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const color = this.color.value;
                    this.mint(color);
                  }}
                >
                  <input
                    type="text"
                    className="form-control mb-1"
                    placeholder="e.g. #FFFFFF"
                    ref={(input) => {
                      this.color = input;
                    }}
                  />
                  <input
                    type="submit"
                    className="btn btn-block btn-primary"
                    value="MINT"
                  />
                </form>
              </div>
            </main>
          </div>
          <hr />
          <div >
            <h1>Your Collection</h1>
          </div>
          <div className="row text-center">
            {this.state.colors.map((color, key) => {
              if (this.state.account === this.state.owners[key]) {
                return (
                  <div key={key} className="col-md-3 mb-3">
                    <div
                      className="token"
                      style={{ backgroundColor: color }}
                    ></div>
                    <div> {color}</div>
                    <div><button type="button" class="btn btn-primary">Send To Auction</button></div>
                  </div>
                );
              }
            })}
          </div>
          <hr />
          <div>
            <h1>Currently In Auction</h1>
          </div>
        </div>
      </div>
    );
  }
}
