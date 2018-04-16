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
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton'
import NavigationClose from 'material-ui/svg-icons/navigation/close'
import IconButton from 'material-ui/IconButton'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      dataSource: [],
      searchVal: '',
      results: [],
      focus: false,
      randomWord: undefined,
    }
    this.debouncedSearch = debounce(this.search, 400)
  }

  componentDidMount() {
    axios
      .get(`http://46.36.220.65:8080/getRuRandom`)
      .then(result => result.data)
      .then(response => response.word)
      .then(word => word.ru)
      .then(randomWord => this.setState({ randomWord }))
      .catch(err => {
        console.error(err)
        this.setState({ randomWord: 'авиация' })
      })
  }

  search = (val) => {
    if (val.trim()) {
      this.setState({ progresBar: true })
      axios
        .get(`http://46.36.220.65:8080/getRu?query=${val}&start=0&count=3`)
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
        .get(`http://46.36.220.65:8080/getRu?query=${this.state.searchVal}&start=0&count=30`)
        .then(result => result.data)
        .then(response => this.setState({ results: response.data.length ? response.data : [{ru: '', ng: 'Бу соьз соьзликте йок ):'}], circularProgress: false }))
        .catch(err => {
          console.error(err)
          this.setState({ circularProgress: false })
        })
    }
  }

  handleClick = () => {
    if (this.state.searchVal) {
      this.handleRequest(this.state.searchVal, -1)
    }
  }

  handleUpdate = (value, data, params) => {
    this.setState({ searchVal: value })
    if (params.source === 'change') {
      this.debouncedSearch(value)
    }
  }

  render() {
    return (
      <div className={this.state.focus ? 'App offset' : 'App'} >
      <Drawer
        docked={false}
        width={200}
        open={this.state.drawer}
        onRequestChange={(open) => this.setState({drawer: open})}
      >
        <AppBar
          showMenuIconButton={false}
          iconElementRight={
            <IconButton onClick={() => this.setState({drawer: false})} >
              <NavigationClose />
            </IconButton>
          }
        />
        <RadioButtonGroup
          name='lang'
          defaultSelected='ru-ng'
          className='radio-container'
        >
          <RadioButton
            value='ru-ng'
            label='орысша - ногайша'
          />
          <RadioButton
            value='ng-ru'
            label='ногайша - орысша'
            disabled
          />
        </RadioButtonGroup>
        <p className='copyright'>
          © Dinislam
        </p>
      </Drawer>
        <div className='top-container'>
          <AppBar
            title='Соьзлик'
            onLeftIconButtonClick={event => this.setState({drawer: true})}
          />
          <div className='progress-bar'>
            {this.state.progresBar ? <LinearProgress mode="indeterminate" style={{ borderRadius: 'none' }} /> : null}
          </div>
          <div className='search-box'>
            <AutoComplete
              onFocus={() => this.setState({ focus: true })}
              onBlur={() => this.setState({ focus: false })}
              hintText={`Мысалы: ${this.state.randomWord}`}
              floatingLabelText='Кайсы соьзди излейсинъиз?'
              dataSource={this.state.dataSource}
              onUpdateInput={this.handleUpdate}
              dataSourceConfig={{ text: 'ru', value: 'ng' }}
              onNewRequest={this.handleRequest}
              filter={AutoComplete.caseInsensitiveFilter}
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
                    <Card key={res.ng}>
                      <CardHeader subtitle={res.ru} />
                      <CardText>
                        {res.ng}
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
