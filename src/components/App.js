import DStorage from "../abis/DStorage.json";
import DVideo from "../abis/DVideo.json";
import React, { Component } from "react";
import Navbar from "./Navbar";
import Main from "./Main";
import Web3 from "web3";
import "./App.css";
import Video from "./Video";

const ipfsClient = require("ipfs-http-client");
const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  apiPath: '/api/v0'
}); 

class App extends Component {
  async componentWillMount() {
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
    // Network ID
    const networkId = await web3.eth.net.getId();
    const networkData = DStorage.networks[networkId];
    const networkData1= DVideo.networks[networkId];
    if (networkData) {
      // Assign contract
      const dstorage = new web3.eth.Contract(DStorage.abi, networkData.address);
      this.setState({ dstorage });
      // Get files amount
      const filesCount = await dstorage.methods.fileCount().call();
      this.setState({ filesCount });
      // Load files&sort by the newest
      for (var i = filesCount; i >= 1; i--) {
        const file = await dstorage.methods.files(i).call();
        this.setState({
          files: [...this.state.files, file],
        });
      }
    } else {
      window.alert("DStorage contract not deployed to detected network.");
    }
    if(networkData1){
      const dvideo = new web3.eth.Contract(DVideo.abi, networkData1.address);
      this.setState({ dvideo });
      const videosCount = await dvideo.methods.videoCount().call();
      this.setState({ videosCount });
      for (i = videosCount; i >= 1; i--) {
        const video = await dvideo.methods.videos(i).call();
        this.setState({
          videos: [...this.state.videos, video],
        });
      }
      const latest = await dvideo.methods.videos(videosCount).call();
      this.setState({
        currentHash: latest.hash,
        currentTitle: latest.title,
      }); 
      this.setState({ loading: false });
    }
    else {
      window.alert("DVideo contract not deployed to detected network.");
    }
  }

  // Get file from user
  captureFile = (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      this.setState({
        buffer: Buffer(reader.result),
        type: file.type,
        name: file.name,
      });
      console.log("buffer", this.state.buffer);
    };
  };
  captureVideo = (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      this.setState({ buffer1: Buffer(reader.result) });
      console.log("buffer", this.state.buffer1);
    };
  };
  uploadVideo = (title) => {
    console.log("Submitting file to IPFS...");
    ipfs.add(this.state.buffer1, (error, result) => {
      console.log("IPFS result", result);
      if (error) {
        console.error(error);
        return;
      }
      this.setState({ loading: true });
      this.state.dvideo.methods
        .uploadVideo(result[0].hash, title)
        .send({ from: this.state.account })
        .on("transactionHash", (hash) => {
          this.setState({ loading: false });
        });
    });
  };
  changeVideo = (hash, title) => {
    this.setState({ 'currentHash': hash });
    this.setState({ 'currentTitle': title });
  };
  uploadFile = (description) => {
    console.log("Submitting file to IPFS...");

    // Add file to the IPFS
    ipfs.add(this.state.buffer, (error, result) => {
      console.log("IPFS result", result);
      if (error) {
        console.error(error);
        return;
      }
      this.setState({ loading: true });
      // Assign value for the file without extension
      if (this.state.type === "") {
        this.setState({ type: "none" });
      }
      this.state.dstorage.methods
        .uploadFile(
          result[0].hash,
          result[0].size,
          this.state.type,
          this.state.name,
          description
        )
        .send({ from: this.state.account })
        .on("transactionHash", (hash) => {
          this.setState({
            loading: false,
            type: null,
            name: null,
          });
          window.location.reload();
        })
        .on("error", (e) => {
          window.alert("Error");
          this.setState({ loading: false });
        });
    });
  };

  constructor(props) {
    super(props);
    this.state = {
      account: "",
      dstorage: null,
      files: [],
      loading: false,
      type: null,
      name: null,
      dvideo: null,
      videos: [],
      currentHash: null,
      currentTitle: null,
      buffer1: null,
    };
    this.uploadFile = this.uploadFile.bind(this);
    this.captureFile = this.captureFile.bind(this);
    this.uploadVideo = this.uploadVideo.bind(this);
    this.captureVideo = this.captureVideo.bind(this);
    this.changeVideo = this.changeVideo.bind(this);
  }

  render() {
    return (
      <div className="container">
        <Navbar account={this.state.account} />
        {this.state.loading ? (
          <div id="loader" className="text-center mt-5">
            <p>Loading...</p>
          </div>
        ) : (
          <Main
            files={this.state.files}
            captureFile={this.captureFile}
            uploadFile={this.uploadFile}
          />
        )}
        {this.state.loading ? (
          <div id="loader1" className="text-center mt-5">
            <p>Loading...</p>
          </div>
        ) : (
          <Video
            videos={this.state.videos}
            uploadVideo={this.uploadVideo}
            captureVideo={this.captureVideo}
            changeVideo={this.changeVideo}
            currentHash={this.state.currentHash}
            currentTitle={this.state.currentTitle}
          />
        )}
      </div>
    );
  }
}

export default App;
