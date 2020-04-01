const view = {

    displayFields(rows) {
      const playBoard = document.querySelector('#play-board')
      playBoard.setAttribute("style",`grid-template-columns: repeat(${rows},auto);`)
      playBoard.innerHTML =``
      for(let i=0;i<rows*rows;i++){
        playBoard.innerHTML += `
        <div class="block" id="${i}" ></div>
        `
      }
    },

    showFieldContent(field) {
      const block = document.getElementById(`${field.number}`)
      if(field.state === 'mine') {
        block.innerHTML = `<i class="fas fa-bomb" ></i>`
      }
      else if(field.state === 'ocean'){
        controller.spreadOcean(field)
        block.classList.add('ocean')
      }
      else{
        block.classList.add('number')
        block.classList.add(`n${field.state}`)
        block.innerHTML = field.state
      }
    },
    renderInfo(flag){
      const playingBtn = document.querySelector('.playingBtn')
      playingBtn.innerHTML = `
      <button class="selectMode" onclick="view.playingModeBtn(this)">Select Mode</button>
      踩地雷
      <button class="restart" onclick="view.playingModeBtn(this)">Restart</button>
      `
      const Info = document.querySelector('.info')
      Info.innerHTML = `
          剩餘棋子: ${flag}
      `
    }
    ,
    renderTime(time) {
      const timer = document.querySelector('.timer')
      timer.textContent = `時間 :  ${time} 秒`
    },
  
    showBoard() {
      for(let field of model.fields){
        this.showFieldContent(field)
      }
      window.clearInterval(model.timer)
    },

    inputHint(){
      const header = document.querySelector('header')
      const inputRows = Number(document.querySelector('#inputRows').value)
      if(inputRows<=3){
        const rowsHint = document.querySelector('#rowsHint')
        rowsHint.textContent = 
        ` 列數至少要大於3`
      }
      else{
        rowsHint.textContent = ''

        const inputMines = Number(document.querySelector('#inputMines').value)
        if(inputMines < 2 || inputMines >= Math.pow(inputRows-1,2)){
          const minesHint = document.querySelector('#minesHint')
          minesHint.textContent = 
          ` 地雷數目需介於 2 ～${Math.pow(inputRows-1,2)-1} 之間`
        }
        else{
          header.innerHTML = ''
          controller.createGame(inputRows,inputMines)
        }
      }
    },
    chooseMode(event){
      const header = document.querySelector('header')
      if(event.classList.contains('beginner')){
        controller.createGame(9,10)
      }
      else if(event.classList.contains('intermediate')){
        controller.createGame(16,40)
      }
      else{
        controller.createGame(30,99)
      }
      header.innerHTML = ''
    }
    ,
    playingModeBtn(event){
      if(event.classList.contains('restart')) 
        controller.reset(model.rows,model.mines.length)
      else{
        window.location.reload()
      }
    }
  }
  
  const controller = {
    createGame(numberOfRows, numberOfMines) {
      let firstClick = true

      model.rows = numberOfRows
      view.displayFields(numberOfRows)  //顯示遊戲畫面
      controller.setMinesAndFields(numberOfMines)  //埋地雷、設定格子內容
      view.renderInfo(model.mines.length-model.flags) //顯示遊戲資料
      view.renderTime(time=0) //顯示時間

      
      const blocks = document.querySelectorAll('.block')  //綁定事件監聽器到格子上
      blocks.forEach(block => {
        block.addEventListener('click', (event) => {
          if(firstClick){
            while(1){  
              //如果第一次踩到地雷，重新選擇fields和mines，直到第一次沒有踩中地雷
              if(!model.isMine(Number(event.target.id)))
                break
              model.fields = [] 
              model.mines = []
              this.setMinesAndFields(numberOfMines)
            }
            model.timer = window.setInterval(()=>{view.renderTime(time++)},1000)  // 開始計時
            firstClick = false
          }
          
          if(controller.dig(model.fields[event.target.id])) //踩中的那格class加上bomb(底顯示為紅色) 
            event.target.classList.add('bomb')

        })
        block.addEventListener('auxclick',(event) =>{
          document.oncontextmenu=function(){return false;}
          event.preventDefault()

          if(event.target.tagName === 'I'){
            event.target.parentElement.classList.remove('flag')
            model.flags --
            event.target.parentElement.innerHTML = ''
          }
          else if(!event.target.classList.contains('flag')){
            event.target.innerHTML = `<i class="fas fa-flag"></i>`
            event.target.classList.add('flag')
            model.flags ++
          }
          else{
            event.target.innerHTML = ''
            event.target.classList.remove('flag')
            model.flags --
          }
          
          view.renderInfo(model.mines.length-model.flags)
        })
      })
    },

    reset(rows,mines){
      model.mines = []
      model.fields = []
      model.rows = 0
      model.flags = 0
      window.clearInterval(model.timer)
      this.createGame(rows,mines)
    }
    ,
    setMinesAndFields(numberOfMines) {

      model.mines = utility.getRandomNumberArray(model.rows*model.rows).slice(0,numberOfMines)
      console.log(model.mines)
      for(let i=0;i<model.rows*model.rows;i++){
        model.fields.push({number:i,isDigged:0,row:Math.floor(i/model.rows),col:i%model.rows,state:0})
        if(model.isMine(i)){   //先放地雷
          model.fields[i].state = 'mine'
        }
      }
      console.log(model.fields)

      model.fields.forEach(field => {  //放完地雷後算數字和海洋
        if(field.state !== 'mine') controller.getFieldData(field.number)
      })
      console.log(model.fields)
    },
    
    getFieldData(fieldIdx) {
      let count = 0
      model.aroundArray(fieldIdx).map(index => {
        if (model.fields[index].state === 'mine') count ++
        if (count !== 0)  model.fields[fieldIdx].state = count
        else {
          model.fields[fieldIdx].state = 'ocean'
        }
      })
    },
  
    dig(field) {
      let digged = 0 
      if(!field.isDigged){
        field.isDigged = 1
        
        if(field.state === 'mine'){
          view.showBoard()
          model.fields.forEach(field => {
            if(field.state!== 'mine') field.isDigged = 1
          })
          // alert('Game Over')
          return true
        }
        else{
          view.showFieldContent(field)
          digged = this.checkDiggedNumber()
          if(digged === 0){
            view.showBoard()
            alert('You Win !')
          }
        }
      }
    },

    checkDiggedNumber(){

      let undigged = model.fields.length - model.mines.length
      model.fields.forEach(field => {
        if(field.state!=='mine'){
          if(field.isDigged) undigged--
        }
      })
      return undigged
    },

    spreadOcean(field) {
      model.aroundArray(field.number).map(index => controller.dig(model.fields[index]))
    },

  }

  
  const model = {
    flags: 0,

    timer: 0,

    mines: [],
    
    fields: [],

    rows: 0,

    aroundArray(id){
      let rows = Number(model.rows)
      let arr = []
      
      if(model.fields[id].row === 0){
        if(model.fields[id].col === 0){
          arr.push(id+1, id+rows, id+rows+1)
        }
        else if(model.fields[id].col === rows-1){
          arr.push(id-1, id+rows-1, id+rows)
        }
        else{
          arr.push(id-1, id+1, id+rows-1, id+rows, id+rows+1)
        }
      }
      else if(model.fields[id].row === rows-1){
        if(model.fields[id].col === 0){
          arr.push(id-rows, id-rows+1, id+1)
        }
        else if(model.fields[id].col === rows-1){
          arr.push(id-rows-1, id-rows, id-1)
        }
        else{
          arr.push(id-rows-1, id-rows, id-rows+1, id-1, id+1)
        }
      }
      else if(model.fields[id].col === 0){
        arr.push(id-rows, id-rows+1, id+1, id+rows, id+rows+1)
      }
      else if(model.fields[id].col === rows-1){
        arr.push(id-rows-1, id-rows, id-1, id+rows-1, id+rows)
      }
      else{
        arr.push(id-1-rows, id-rows, id-rows+1, id-1, id+1, id+rows-1, id+rows, id+rows+1)
      }
      
      return arr
    },
  
    
    isMine(fieldIdx) {
      return this.mines.includes(fieldIdx)
    }
  }
  
  const utility = {
    /**
     * getRandomNumberArray()
     * 取得一個隨機排列的、範圍從 0 到 count參數 的數字陣列。
     * 例如：
     *   getRandomNumberArray(4)
     *     - [3, 0, 1, 2]
     */
    getRandomNumberArray(count) {
      const number = [...Array(count).keys()]
      for (let index = number.length - 1; index > 0; index--) {
        let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
      }
  
      return number
    }
  }
  
// controller.createGame(9,10)




