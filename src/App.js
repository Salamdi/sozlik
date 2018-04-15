import React, { Component } from 'react'
import AppBar from 'material-ui/AppBar'
import AutoComplete from 'material-ui/AutoComplete'
import RaisedButton from 'material-ui/RaisedButton'
import Search from 'material-ui/svg-icons/action/search'
import {debounce} from 'lodash'
import {Card, CardHeader, CardText} from 'material-ui/Card'
import axios from 'axios'

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
      .get(`https://us-central1-ng-dictionary.cloudfunctions.net/getRuRandom`)
      .then(result => result.data)
      .then(response => response.word)
      .then(word => word.ru)
      .then(randomWord => this.setState({randomWord}))
      .catch(err => {
        console.error(err)
        this.setState({randomWord: 'авиация'})
      })
  }

  search = (val) => {
    if (val.trim()) {
      axios
        .get(`https://us-central1-ng-dictionary.cloudfunctions.net/getRu?query=${val}&start=0&count=3`)
        .then(result => result.data)
        .then(response => this.setState({dataSource: response.data}))
        .catch(err => console.error(err))
    }
  }

  handleRequest = (req, index) => {
    if (index !== -1) {
      this.setState(prevState => ({results: [req]}))
    } else {
      axios
        .get(`https://us-central1-ng-dictionary.cloudfunctions.net/getRu?query=${this.state.searchVal}&start=0&count=30`)
        .then(result => result.data)
        .then(response => this.setState({results: response.data}))
        .catch(err => console.error(err))
    }
  }

  handleClick = () => {
    if (this.state.searchVal) {
      this.handleRequest(this.state.searchVal, -1)
    }
  }

  handleUpdate = (value, data, params) => {
    this.setState({searchVal: value})
    if (params.source === 'change') {
      this.debouncedSearch(value)
    }
  }

  render() {
    let container;
    return (
      <div className={this.state.focus ? 'App offset' : 'App'} ref={ref => container = ref} >
        <div className='top-container'>
          <AppBar
            title='Соьзлик'
          />
          <div className='search-box'>
            <AutoComplete
              onFocus={() => {
                this.setState({focus: true})
                container.ontouchmove = event => false
              }}
              onBlur={() => {
                this.setState({focus: false})
                container.ontouchmove = event => true
              }}
              hintText={`Мысалы: ${this.state.randomWord}`}
              floatingLabelText='Кайсы соьзди излейсинъиз?'
              dataSource={this.state.dataSource}
              onUpdateInput={this.handleUpdate}
              dataSourceConfig = {{text: 'ru', value: 'ng'}}
              onNewRequest={this.handleRequest}
              filter={AutoComplete.caseInsensitiveFilter}
            />
            <div className='search-button'>
              <RaisedButton
                fullWidth
                primary
                icon={<Search/>}
                onClick={this.handleClick}
                disabled={!this.state.searchVal}
              />
            </div>
          </div>
        </div>
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
      </div>
    );
  }
}

export default App;
