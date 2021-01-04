import React, { useState,useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import FundraiserContract from "./contracts/Fundraiser.json";
import Web3 from 'web3'
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FilledInput from '@material-ui/core/FilledInput';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import { Link } from 'react-router-dom'

const useStyles = makeStyles(theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  card: {
    maxWidth: 450,
    // height: 400,
    margin: 10,
  },
  media: {
    height: 140,
  },
  button: {
    margin: theme.spacing(1),
  },
  formControl: {
    margin: theme.spacing(1),
    display: 'table-cell'
  },
  paper: {
    position: 'absolute',
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: 'none',
    boxShadow: 'none',
    padding: 4,
  },
}));



const FundraiserCard = (props) => {
  async function getAccount() {
    const accounts = await window.ethereum.enable();
    const account = accounts[0];
    console.log(account);
    // do something with new account here
  }

    const classes = useStyles();
    const web3 = new Web3(new Web3.providers.HttpProvider('http://192.168.99.1:7545'))

    const [ contract, setContract] = useState(null)
    const [ accounts, setAccounts ] = useState(null)
    const [ fundName, setFundname ] = useState(null)
    const [ description, setDescription ] = useState(null)
    const [ totalDonations, setTotalDonations ] = useState(null)
    const [ donationCount, setDonationCount ] = useState(null)
    const [ imageURL, setImageURL ] = useState(null)
    const [ url, setURL ] = useState(null)
    const [ exchangeRate, setExchangeRate ] = useState(null)
    const [open, setOpen] = React.useState(false);
    const [donationAmount, setDonationAmount] = useState(null)
    const [ userDonations, setUserDonations ] = useState(null)
    const [ isOwner, setIsOwner ] = useState(false)
    const [ beneficiary, setNewBeneficiary ] = useState(false)

    const ethAmount = (donationAmount / exchangeRate || 0).toFixed(4)

    const { fundraiser } = props

    const cc = require('cryptocompare')

    useEffect(() => {
      if (fundraiser) {
          init(fundraiser)
      }
    }, [fundraiser]);

    window.ethereum.on('accountsChanged', function (accounts) {
      window.location.reload()
    });

    const init = async (fundraiser) => {
        try {

          // const web3 = await getWeb3();
          const fund = fundraiser
          const networkId = await web3.eth.net.getId();
          const deployedNetwork = FundraiserContract.networks[networkId];
          // const accounts = await web3.eth.getAccounts(); //get all accounts from contract
          const accounts = await window.ethereum.enable(); //get account from metamask seletecd
          const instance = new web3.eth.Contract(
              FundraiserContract.abi,
              fund
          );
          setContract(instance)
          setAccounts(accounts)

          // Placeholder for getting information about each contract
          const name = await instance.methods.name().call()
          const description = await instance.methods.description().call()
          const totalDonations = await instance.methods.totalDonations().call()
          const imageURL = await instance.methods.imageURL().call()
          const url = await instance.methods.url().call()

          // calculate the exchange rate here
          const exchangeRate = await cc.price('ETH', ['USD'])
          setExchangeRate(exchangeRate.USD)
          // pass in the coin you want to check and the currency
          const eth = web3.utils.fromWei(totalDonations, 'ether')
          const dollarDonationAmount = exchangeRate.USD * eth
          
          setFundname(name)
          setDescription(description)
          setImageURL(imageURL)
          setTotalDonations(dollarDonationAmount)
          setURL(url)

          const userDonations = await instance.methods.myDonations().call({ from: accounts[0]})
          // console.log(userDonations)
          setUserDonations(userDonations)

          // const isUser = accounts[0]
          
          const isOwner = await instance.methods.owner().call()
          if (isOwner.toUpperCase() === accounts[[0]].toUpperCase()) {
            setIsOwner(true)
          }
        }
        catch(error) {
        alert(
            `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
        }
    }

    // Add this code right below the useEffect method.
    

    const handleOpen = () => {
      setOpen(true);
      // this will set our state to true and open the modal
    }

    const handleClose = () => {
      setOpen(false);
      // this will close the modal on click away and on button close
    };    

    const submitFunds = async () => {
      const fundraisercontract = contract
      const ethRate = exchangeRate
      const ethTotal = donationAmount / ethRate
      const donation = web3.utils.toWei(ethTotal.toString())
    
      await contract.methods.donate().send({
        from: accounts[0],
        value: donation,
        gas: 650000
      })
      setOpen(false);
      init(fundraiser);
    }

    const renderDonationsList = () => {
      var donations = userDonations
      if (donations === null) {return null}
      // we'll return null so we don't get an error when the
      // donations aren't in the state yet
      const totalDonations = donations.values.length
      let donationList = []
      var i
      for (i = 0; i < totalDonations; i++) {
        const ethAmount = web3.utils.fromWei(donations.values[i])
        const userDonation = exchangeRate * ethAmount
        const donationDate = donations.dates[i]
        donationList.push({ donationAmount: userDonation.toFixed(2),
            date: donationDate
        })
      }

      return donationList.map((donation, index) => {
        return (
          <div className="donation-list" key={index}>
            <p>${donation.donationAmount}</p>
            <Button variant="contained" color="primary">
              <Link
                className="donation-receipt-link"
                to={{ pathname: '/receipts', state: { donation: donation.donationAmount, date: donation.date}}}
              >
                Request Receipt
              </Link>
            </Button>
          </div>
        )
      })
    }

    const withdrawalFunds = async () => {
      await contract.methods.withdraw().send({
        from: accounts[0],
      })
    
      alert('Funds Withdrawn!')
    }

    const setBeneficiary = async () => {
      await contract.methods.setBeneficiary(beneficiary).send({
        from: accounts[0],
      })
    
      alert(`Fundraiser Beneficiary Changed`)
    }

  return (
    <div className="fundraiser-card-container">
      <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">Donate to {fundName}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <img src={imageURL} width='200px' height='200px' />
            <p>{description}</p>

            <div className="donation-input-container">
              <FormControl className={classes.formControl}>
                $
                <Input
                  id="component-simple"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="0.00"
                />
              </FormControl>

              <span>Eth Amount: {ethAmount}</span>
            </div>
            <Button onClick={submitFunds} variant="contained" color="primary">
              Donate
            </Button>
            <div>
              <h3>My donations</h3>
              {renderDonationsList()}
            </div>

            {isOwner &&
              <div>
                <FormControl className={classes.formControl}>
                  Beneficiary:
                  <Input
                    value={beneficiary}
                    onChange={(e) => setNewBeneficiary(e.target.value)}
                    placeholder="Set Beneficiary"
                  />
                </FormControl>

                <Button variant="contained" style={{ marginTop: 20 }} color="primary" onClick={setBeneficiary}>
                  Set Beneficiary
                </Button>
              </div>
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          {isOwner && 
            <Button variant="contained" color="primary" onClick={withdrawalFunds}>
              Withdrawal
            </Button>
          }
        </DialogActions>
      </Dialog>
      <Card className={classes.card} onClick={handleOpen}>
        <CardActionArea>
        { imageURL ? 
            (<CardMedia
                className={classes.media}
                image={imageURL}
                title="Fundraiser Image"
            />
            ) : (
            <div></div>
          )
        }
          
          <CardContent>
            <Typography gutterBottom variant="h5" component="h2">
              {fundName}
            </Typography>
            <Typography variant="body2" color="textSecondary" component="span">
              <p>{description}</p>
              <p>Total Donations: ${totalDonations}</p>
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <Button 
            size="small" 
            color="primary"
            onClick={handleOpen}
            variant="contained"
            className={classes.button}
          >
            View More
          </Button>
        </CardActions>
      </Card>
    </div>
  )
}

export default FundraiserCard;