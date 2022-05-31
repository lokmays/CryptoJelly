import './create.css'
import Image from '../../assets/Image.png'
import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import Web3Modal from 'web3modal'

import { nftAddress, nftMarketAddress } from '../../config'

// // importing abis
import NFT from '../../artifacts/contracts/NFT.sol/NFT.json'
import Market from '../../artifacts/contracts/NFTMarket.sol/NFTMarket.json'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

const Create = () => {
  const [fileUrl, setFileUrl] = useState(Image)
  const [formInput, updateFormInput] = useState({
    price: '',
    name: '',
    description: '',
  })

  async function onChange(e) {
    const file = e.target.files[0]

    try {
      const added = await client.add(file, {
        progress: (p) => console.log(`Received: ${p}`),
      })
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      setFileUrl(url)
    } catch (error) {
      console.log(error)
    }
  }

  async function createItem() {
    console.log('first')
    const { name, description, price } = formInput
    if (!name || !description || !price || !fileUrl) return
    const data = JSON.stringify({
      name,
      description,
      image: fileUrl,
    })
    try {
      const added = await client.add(data)
      const url = `https://ipfs.infura.io/ipfs/${added.path}`
      createSale(url)
    } catch (error) {
      console.log('Error has been occured while uploading file ', error)
    }
  }

  async function createSale(url) {
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    // Create a reference to the nft contract
    let contract = new ethers.Contract(nftAddress, NFT.abi, signer)
    let transaction = await contract.createToken(url)
    let tx = await transaction.wait()

    let event = tx.events[0]
    let value = event.args[2]
    let tokenId = value.toNumber()

    const price = ethers.utils.parseUnits(formInput.price, 'ether')

    contract = new ethers.Contract(nftMarketAddress, Market.abi, signer)
    let listingPrice = await contract.getListingPrice()
    listingPrice = listingPrice.toString()

    transaction = await contract.createMarketItem(nftAddress, tokenId, price, {
      value: listingPrice,
    })

    await transaction.wait()
  }

  return (
    <div className="create section__padding">
      <div className="create-container">
        <h1>Créer une nouvelle piéce d'art</h1>
        <p className="upload-file">Uploader un fichier</p>
        <div className="upload-img-show">
          <h3>JPG, PNG, GIF, SVG, WEBM, MP4. Max 100mb.</h3>
          <img src={fileUrl} alt="banner" width="300px" height="300px" />
          <p>Glisser-déposer le fichier</p>
        </div>
        <form className="writeForm" autoComplete="off">
          <div className="formGroup">
            <label>Uploader</label>
            <input
              type="file"
              className="custom-file-input"
              onChange={onChange}
            />
          </div>
          <div className="formGroup">
            <label>Titre</label>
            <input
              type="text"
              placeholder="Item Name"
              autoFocus={true}
              onChange={(e) =>
                updateFormInput({ ...formInput, name: e.target.value })
              }
            />
          </div>
          <div className="formGroup">
            <label>Description</label>
            <textarea
              type="text"
              rows={4}
              placeholder="Decription of your item"
              onChange={(e) =>
                updateFormInput({ ...formInput, description: e.target.value })
              }
            ></textarea>
          </div>
          <div className="formGroup">
            <label>Prix</label>
            <div className="twoForm">
              <input
                type="text"
                placeholder="Price"
                onChange={(e) =>
                  updateFormInput({ ...formInput, price: e.target.value })
                }
              />
              <select>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>

          {/* <button>Create Item</button> */}
          <a onClick={createItem} className="btn btn-grad btn_create">
            Créer
          </a>
        </form>
      </div>
    </div>
  )
}

export default Create
