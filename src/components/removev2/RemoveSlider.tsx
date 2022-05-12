import {Flex, Slider, SliderFilledTrack, SliderMark, SliderThumb, SliderTrack, Text} from "@chakra-ui/react";
import {Dispatch, SetStateAction} from "react";

interface RemoveSliderProps {
  sliderValue: number,
  setSliderValue: Dispatch<SetStateAction<number>>;
}

const RemoveSlider = (props: RemoveSliderProps) => {
  return (
    <Flex flexDir={'column'} width={'90%'} height={'120px'} color={'white'} justifyContent={'space-between'}
          backgroundColor={'#343047'}
          borderRadius={'20px'} padding={'10px'}
    >
        <Flex marginTop='10px' justifyContent={'center'}>
          <Text fontSize={'2xl'}>{props.sliderValue}%</Text>
        </Flex>
      <Flex justifyContent={'center'}>
        <Slider width={'80%'} marginBottom={'20px'} value={props.sliderValue} aria-label='slider-ex-6'
                onChange={(val) => props.setSliderValue(val)}
                colorScheme='purple'>
          <SliderMark value={0} mt='1' ml='-2.5' fontSize='sm' color='white'>
            0%
          </SliderMark>
          <SliderMark value={25} mt='1' ml='-2.5' fontSize='sm' color='white'>
            25%
          </SliderMark>
          <SliderMark value={50} mt='1' ml='-2.5' fontSize='sm' color='white'>
            50%
          </SliderMark>
          <SliderMark value={75} mt='1' ml='-2.5' fontSize='sm' color='white'>
            75%
          </SliderMark>
          <SliderMark value={100} mt='1' ml='-2.5' fontSize='sm' color='white'>
            100%
          </SliderMark>
          {/*<SliderMark*/}
          {/*  value={props.sliderValue}*/}
          {/*  textAlign='center'*/}
          {/*  bg='purple.600'*/}
          {/*  color='white'*/}
          {/*  mt='-10'*/}
          {/*  ml='-5'*/}
          {/*  w='12'*/}
          {/*>*/}
          {/*  {props.sliderValue}%*/}
          {/*</SliderMark>*/}
          <SliderTrack bg='purple.900'>
            <SliderFilledTrack/>
          </SliderTrack>
          <SliderThumb/>
        </Slider>
      </Flex>
    </Flex>

  )
}

export default RemoveSlider