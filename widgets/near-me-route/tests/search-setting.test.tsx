describe('Search Settings component', function () {
  it('Tests are commented out as removing enzyme, should be added back with @testing-library', () => { })
  // //Create required config for General settings
  // const mockSearchSettingConfig = {
  //   defineSearchArea: false,
  //   bufferDistance: 0,
  //   distanceUnits: 'feet',
  //   searchByCurrentMapExtent: false
  // }
  // const props = {
  //   theme: mockTheme,
  //   intl: createIntl({ locale: 'en' }),
  //   isRTL: false,
  //   config: mockSearchSettingConfig,
  //   onSearchSettingsUpdated: jest.fn()
  // }
  // const wrapper = shallow(<SearchSetting {...props} />)

  // it('By default Define search area option should be disabled', async function () {
  //   expect(wrapper.state('defineSearchAreaOption')).toEqual(false)
  // })

  // it('By default search by distance option is enabled', async function () {
  //   //Search by distance should be enabled and current map extent should be disabled
  //   expect(wrapper.find('Radio').getElements()[0].props.checked).toEqual(true)
  //   expect(wrapper.find('Radio').getElements()[1].props.checked).toEqual(false)
  // })

  // it('By default buffer distance value should be 0', async function () {
  //   expect(wrapper.state('bufferDistance')).toEqual(0)
  // })

  // it('Search by current map extent should be enabled', async function () {
  //   const mockSearchSettingConfig = {
  //     defineSearchArea: false,
  //     bufferDistance: 0,
  //     distanceUnits: 'feet',
  //     searchByCurrentMapExtent: true
  //   }
  //   const props = {
  //     theme: mockTheme,
  //     intl: createIntl({ locale: 'en' }),
  //     isRTL: false,
  //     config: mockSearchSettingConfig,
  //     onSearchSettingsUpdated: jest.fn()
  //   }
  //   const wrapper = shallow(<SearchSetting {...props} />)
  //   //Search by current map extent should be enabled and distance should be disabled
  //   expect(wrapper.find('Radio').getElements()[0].props.checked).toEqual(false)
  //   expect(wrapper.find('Radio').getElements()[1].props.checked).toEqual(true)
  // })
})
