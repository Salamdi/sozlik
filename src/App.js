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
import Done from 'material-ui/svg-icons/action/done'
import Undo from 'material-ui/svg-icons/content/undo'

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

class App extends Component {
  constructor(props) {
    super(props)
    const preservedState = JSON.parse(localStorage.getItem('preservedState'));
    let {interfaceLang} = preservedState ? preservedState : {};
    interfaceLang = interfaceLang instanceof Object ? interfaceLang : {current: interfaceLang, prev: interfaceLang === 'ng' ? 'en' : 'ng'};
    if (preservedState) preservedState.interfaceLang = interfaceLang;
    this.state = preservedState && preservedState.randomWords && preservedState.interfaceLang
      ? preservedState
      : {
        dataSource: [],
        searchVal: '',
        results: [],
        focus: false,
        randomWords: {
          'ng-ru': '',
          'ru-ng': '',
        },
        dictionary: 'ng-ru',
        interfaceLang: {
          current: 'en',
          prev: 'ng'
        }
      }
    this.search = debounce(this.search, 400)
    this.saveState = debounce(this.saveState, 1000)
  }

  componentDidMount() {
    this.setState({
      globalSpinner: false,
      errSnackbar: false,
      langSnackbar: false,
      progresBar: false,
      circularProgress: false,
    })
    axios
      .get(`https://immense-cove-36116.herokuapp.com/random`)
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
    if (val) {
      this.setState({ progresBar: true })
      axios
        .get(`https://immense-cove-36116.herokuapp.com/ng-ru/${val}`)
        .then(result => result.data)
        .then(response => this.setState({ dataSource: response, progresBar: false }))
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
        .get(`https://immense-cove-36116.herokuapp.com/ng-ru/${this.state.searchVal}`)
        .then(result => result.data)
        .then(response => this.setState({ results: response.length ? response : [{ word: '', translation: langs[this.state.interfaceLang.current]['notFoundStub'] }], circularProgress: false }))
        .catch(err => {
          console.error('error occured:', err)
          this.setState({ circularProgress: false })
          if (err.message === 'Failed to fetch' || err.message === 'Network Error') { // TODO: check fetch network errors (remove or leave 'Failed to fecth' error message check)
            console.log(err.message)
            this.setState({ errSnackbar: true })
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
              label={langs[this.state.interfaceLang.current]['ng-ru']}
            />
          </RadioButtonGroup>
          <p className='copyright'>
            © Dinislam
          </p>
        </Drawer>
        <Snackbar
          open={this.state.errSnackbar || false}
          message={langs[this.state.interfaceLang.current]['connectionError']}
          action={<Done style={{ color: '#ff4081', marginTop: '4px' }} />}
          autoHideDuration={4000}
          onActionClick={() => this.setState({ errSnackbar: false })}
          onRequestClose={() => this.setState({ errSnackbar: false })}
        />
        <Snackbar
          open={this.state.langSnackbar || false}
          message={
            `${langs[this.state.interfaceLang.current]['interfaceLangChange']}: ${langs[this.state.interfaceLang.current]['interfaceLang' + capitalize(this.state.interfaceLang.current)]}`
          }
          action={<Undo style={{ color: '#ff4081', marginTop: '4px' }} />}
          autoHideDuration={4000}
          onActionClick={() => this.setState(state => {
            const newState = {
              interfaceLang: {
                current: state.interfaceLang.prev,
                prev: state.interfaceLang.current // no way to get the previous lang so set the current (swap them)
              },
              langSnackbar: false,
            }
            if (state.results[0] && state.results[0].translation === langs[state.interfaceLang.current]['notFoundStub']) {
              newState.results = [{ translation: langs[state.interfaceLang.prev]['notFoundStub'] }];
            }
            return newState
          })}
          onRequestClose={() => this.setState({ langSnackbar: false })}
        />
        <AppBar
          title={langs[this.state.interfaceLang.current]['title']}
          onLeftIconButtonClick={event => this.setState({ drawer: true })}
          iconElementRight={
            <IconMenu
              iconButtonElement={
                <IconButton>
                  <Language />
                </IconButton>
              }
              onChange={(event, value) => {
                this.setState({ globalSpinner: true })
                setTimeout(() => {
                  this.setState(state => {
                    const newState = {
                      interfaceLang: {
                        current: value,
                        prev: state.interfaceLang.current
                      },
                      globalSpinner: false,
                      langSnackbar: true,
                    }
                    if (this.state.results[0] && this.state.results[0].translation === langs[state.interfaceLang.current]['notFoundStub']) {
                      newState.results = [{ translation: langs[value]['notFoundStub'] }]
                    }
                    return newState
                  })
                }, 1000)
              }}
              value={this.state.interfaceLang.current}
            >
              <MenuItem
                primaryText={langs[this.state.interfaceLang.current]['interfaceLangRu']}
                value='ru'
              />
              <MenuItem
                primaryText={langs[this.state.interfaceLang.current]['interfaceLangNg']}
                value='ng'
              />
              <MenuItem
                primaryText={langs[this.state.interfaceLang.current]['interfaceLangEn']}
                value='en'
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
              hintText={`${langs[this.state.interfaceLang.current]['hint']}: ${this.state.randomWords.word}`}
              floatingLabelText={langs[this.state.interfaceLang.current]['label']}
              dataSource={this.state.dataSource}
              onUpdateInput={this.handleUpdate}
              dataSourceConfig={{ text: 'word', value: 'translation' }}
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
                    <Card key={res.translation}>
                      <CardHeader subtitle={res.word} />
                      <CardText>
                        {res.translation}
                      </CardText>
                    </Card>
                  ))
                }
              </main>
            )
        }
        {
          this.state.globalSpinner
            ? (
              <div className='global-spinner'>
                <CircularProgress size={100} thickness={8} />
              </div>
            )
            : null
        }
      </div>
    );
  }
}

export default App;
