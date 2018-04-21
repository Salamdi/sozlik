import React, { Component } from 'react'
import AppBar from 'material-ui/AppBar'
import AutoComplete from 'material-ui/AutoComplete'
import RaisedButton from 'material-ui/RaisedButton'
import Search from 'material-ui/svg-icons/action/search'
import { debounce } from 'lodash'
import { Card, CardHeader, CardText } from 'material-ui/Card'
import axios from 'axios'
import LinearProgress from 'material-ui/LinearProgress'
import CircularProgress from 'material-ui/CircularProgress'
import Drawer from 'material-ui/Drawer'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import NavigationClose from 'material-ui/svg-icons/navigation/close'
import IconButton from 'material-ui/IconButton'
import Snackbar from 'material-ui/Snackbar'
import * as langs from './langs'
import Language from 'material-ui/svg-icons/action/language'
import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'

class App extends Component {
  constructor(props) {
    super(props)
    const preserverState = localStorage.getItem('preservedState') && JSON.parse(localStorage.getItem('preservedState'))
    this.state = preserverState && preserverState.randomWords && preserverState.interfaceLang
      ? preserverState
      : {
        dataSource: [],
        searchVal: '',
        results: [],
        focus: false,
        randomWords: {},
        dictionary: 'ng-ru',
        interfaceLang: 'ru'
      }
    this.search = debounce(this.search, 400)
    this.saveState = debounce(this.saveState, 1000)
  }

  componentDidMount() {
    axios
      .get(`https://us-central1-ng-dictionary.cloudfunctions.net/getRandom`)
      .then(result => result.data)
      .then(randomWords => this.setState({ randomWords }))
      .catch(err => {
        console.error(err)
      })
  }

  saveState() {
    localStorage.setItem('preservedState', JSON.stringify(this.state))
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.saveState()
  }

  search = (val) => {
    console.log(this.state.dictionary)
    if (val) {
      this.setState({ progresBar: true })
      axios
        .get(`https://us-central1-ng-dictionary.cloudfunctions.net/${this.state.dictionary === 'ng-ru' ? 'getNg' : 'getRu'}?query=${val}&start=0&count=3`)
        .then(result => result.data)
        .then(response => this.setState({ dataSource: response.data, progresBar: false }))
        .catch(err => {
          console.error(err)
          this.setState({ progresBar: false })
        })
    }
  }

  handleRequest = (req, index) => {
    if (index !== -1) {
      this.setState(prevState => ({ results: [req] }))
    } else {
      this.setState({ circularProgress: true })
      axios
        .get(`https://us-central1-ng-dictionary.cloudfunctions.net/${this.state.dictionary === 'ng-ru' ? 'getNg' : 'getRu'}?query=${this.state.searchVal}&start=0&count=30`)
        .then(result => result.data)
        .then(response => this.setState({ results: response.data.length ? response.data : [{ term: '', description: 'Бу соьз соьзликте йок ):' }], circularProgress: false }))
        .catch(err => {
          console.error('error occured:', err)
          this.setState({ circularProgress: false })
          if (err.message === 'Failed to fetch' || err.message === 'Network Error') {
            console.log(err.message)
            this.setState({ snackbar: true })
          }
        })
    }
  }

  handleClick = () => {
    if (this.state.searchVal) {
      this.handleRequest(this.state.searchVal, -1)
    }
  }

  handleUpdate = (value, data, params) => {
    this.setState({ searchVal: value.trim(), dataSource: [] })
    if (params.source === 'change') {
      this.search(value.trim())
    }
  }

  render() {
    return (
      <div className={this.state.focus ? 'App offset' : 'App'} >
        <Drawer
          docked={false}
          width={200}
          open={this.state.drawer}
          onRequestChange={(open) => this.setState({ drawer: open })}
        >
          <AppBar
            showMenuIconButton={false}
            iconElementRight={
              <IconButton onClick={() => this.setState({ drawer: false })} >
                <NavigationClose />
              </IconButton>
            }
          />
          <RadioButtonGroup
            name='lang'
            className='radio-container'
            defaultSelected={this.state.dictionary || 'ng-ru'}
            onChange={(event, dictionary) => this.setState({ dictionary })}
          >
            <RadioButton
              value='ng-ru'
              label={langs[this.state.interfaceLang]['ng-ru']}
            />
            <RadioButton
              value='ru-ng'
              label={langs[this.state.interfaceLang]['ru-ng']}
            />
          </RadioButtonGroup>
          <p className='copyright'>
            © Dinislam
          </p>
        </Drawer>
        <Snackbar
          open={this.state.snackbar || false}
          message={langs[this.state.interfaceLang]['connectionError']}
          action={langs[this.state.interfaceLang]['connectionErrorAction']}
          autoHideDuration={4000}
          onActionClick={() => this.setState({ snackbar: false })}
          onRequestClose={() => this.setState({ snackbar: false })}
        />
        <AppBar
          style={{
            position: 'fixed',
            top: this.state.focus ? -64 : 0,
            transition: 'all ease 0.4s'
          }}
          title={langs[this.state.interfaceLang]['title']}
          onLeftIconButtonClick={event => this.setState({ drawer: true })}
          iconElementRight={
            <IconMenu
              iconButtonElement={
                <IconButton>
                  <Language />
                </IconButton>
              }
              onChange={(event, value) => this.setState({interfaceLang: value})}
              value={this.state.interfaceLang}
            >
              <MenuItem
                primaryText={langs[this.state.interfaceLang]['interfaceLangRu']}
                value='ru'
              />
              <MenuItem
                primaryText={langs[this.state.interfaceLang]['interfaceLangNg']}
                value='ng'
              />
            </IconMenu>
          }
        />
        <div className='top-container'>
          <div className='progress-bar'>
            {this.state.progresBar ? <LinearProgress mode="indeterminate" style={{ borderRadius: 'none' }} /> : null}
          </div>
          <div className='search-box'>
            <AutoComplete
              onFocus={() => this.setState({ focus: true })}
              onBlur={() => this.setState({ focus: false })}
              hintText={`${langs[this.state.interfaceLang]['hint']}: ${this.state.randomWords[this.state.dictionary]}`}
              floatingLabelText={langs[this.state.interfaceLang]['label']}
              dataSource={this.state.dataSource}
              onUpdateInput={this.handleUpdate}
              dataSourceConfig={{ text: 'term', value: 'description' }}
              onNewRequest={this.handleRequest}
              filter={AutoComplete.caseInsensitiveFilter}
              searchText={this.state.searchVal}
            />
            <div className='search-button'>
              <RaisedButton
                fullWidth
                primary
                icon={<Search />}
                onClick={this.handleClick}
                disabled={!this.state.searchVal}
              />
            </div>
          </div>
        </div>
        {
          this.state.circularProgress
            ? (
              <div className='circular-progress'>
                <CircularProgress size={80} thickness={5} />
              </div>
            )
            : (
              <main className='result'>
                {
                  this.state.results.map(res => (
                    <Card key={res.description}>
                      <CardHeader subtitle={res.term} />
                      <CardText>
                        {res.description}
                      </CardText>
                    </Card>
                  ))
                }
              </main>
            )
        }
      </div>
    );
  }
}

export default App;
