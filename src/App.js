import React, { Component } from 'react'
import AppBar from 'material-ui/AppBar'
import AutoComplete from 'material-ui/AutoComplete'
import RaisedButton from 'material-ui/RaisedButton'
import Search from 'material-ui/svg-icons/action/search'
import {debounce} from 'lodash'
import {Card, CardHeader, CardText} from 'material-ui/Card'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      dataSource: [],
      searchVal: '',
      results: [],
      focus: false,
    }
    this.debouncedSearch = debounce(this.search, 400)
  }

  search = (val) => {
    if (val.trim()) {
      fetch(`https://us-central1-ng-dictionary.cloudfunctions.net/getDict?query=${val}&count=3`)
        .then(res => res.json())
        .then(data => this.setState({dataSource: data}))
        .catch(err => console.error(err))
    }
  }

  handleRequest = (req, index) => {
    if (index !== -1) {
      this.setState(prevState => ({results: [req]}))
    } else {
      console.log(req)
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
              hintText='Мысалы: авиация'
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
