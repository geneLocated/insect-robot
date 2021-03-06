// pages/console/console.js
const app = getApp()
const util = require('../../utils/util.js')
const trans = app.globalData.trans.console

function str2buf(str) {
  var buf = new ArrayBuffer(str.length)
  var bufView = new Uint8Array(buf)
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 如果为 'disabled' 则显示禁用的样式'
    eleType: 'primary'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.setNavigationBarTitle({ title: trans.title })
    // 页面参数：尝试模式
    this.isTry = (options.try === 'true') ? true : false
    // 页面参数：UUID
    this.id = options.id
    console.log(options.id)
    // 标题栏背景色，若未指定则为 #f8f8f8
    var backgroundColor = options.color || 'f8f8f8'
    wx.setNavigationBarColor({
      frontColor: util.getForeColor(backgroundColor),
      backgroundColor: '#' + backgroundColor
    })
    this.animation = wx.createAnimation({
      duration: 200,
      timingFunction: 'ease',
      transformOrigin: 'center'
    })
    if (!this.isTry) this.getTxSeChar()
  },

  /** Get service and characteristic for TX transmission */
  getTxSeChar: function () {
    var self = this
    wx.getBLEDeviceServices({
      deviceId: self.id,
      success: function (res) {
        self.bleServices = res.services

        // Find a deviceId which includes 'FFE5'
        // 查找包含 'FFE5' 的设备 UUID
        self.txService = self.bleServices.find((v) => {
          return v.uuid.indexOf('FFE5') >= 0
        }).uuid

        wx.getBLEDeviceCharacteristics({
          deviceId: self.id,
          serviceId: self.txService,
          success: function (res) {
            // Find a characteristicId which includes 'FFE9'
            // 查找包含 'FFE9' 的特性 UUID
            self.txCharacter = res.characteristics.find((v) => {
              return v.uuid.indexOf('FFE9') >= 0
            }).uuid
          },
        })
      }
    })
  },

  bleServices: [],
  txService: '',
  txCharacter: '',

  eleClick: function (button) {
    if (this.operaCd){
      wx.showToast({
        title: trans.cdToast,
        icon: 'none'
      })
    } else {
      var self = this
      var message, direction
      if (button.target.id === 'button-left') {
        message = 'EL:LLL'
        direction = 'right'
      } else if (button.target.id === 'button-right') {
        message = 'EL:RRR'
        direction = 'left'
      }
      if (this.isTry === false) {
        // 普通模式下，写入 BLE
        self.writeBLE(message, direction)
      } else {
        // 尝试模式下，不写入 BLE，只相应动画
        self.beetleAni(direction)
      }
    }
  },

  // 写 BLE 函数
  writeBLE: function (message, direction) {
    var self = this
    wx.writeBLECharacteristicValue({
      deviceId: self.id,
      serviceId: self.txService,
      characteristicId: self.txCharacter,
      value: str2buf(message),
      success: function (res) {
        self.beetleAni(direction)
      },
      fail: function (res) {
        wx.showToast({ title: trans.writeFailToast, icon: 'none' })
        console.log(res)
      }
    })
  },

  // 响应的动画
  beetleAni: function (direction) {
    var self = this
    //A cooling down time, disable the buttons for a while
    //or else it may damage the robot
    self.operaCd = true
    self.setData({ eleType: 'disabled' })
    setTimeout(() => {
      self.operaCd = false
      self.setData({ eleType: 'primary' })
    }, 400)
    if (direction === 'left')
      this.animation.rotate(-45).step()
    else if (direction === 'right')
      this.animation.rotate(45).step()
    this.animation.rotate(0).step()
    this.setData({
      //export() 会清除之前的动画操作
      animation: self.animation.export()
    })
  },

  operaCd: false,

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    var self = this
    if (!this.isTry) wx.closeBLEConnection({
      deviceId: self.id
    })
  }
})
