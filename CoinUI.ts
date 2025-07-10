import {PropTypes, TextureAsset} from 'horizon/core';
import { UIComponent, Binding, View, Text, Image, ImageSource } from 'horizon/ui';
import {CollectibleTracker} from './CollectibleTracker';

class CoinUI extends UIComponent<typeof CoinUI> {
    static propsDefinition = {
        coinIcon: {type: PropTypes.Asset},
    }
    private goldcount = new Binding<string>('0');


    initializeUI() {
        this.connectLocalBroadcastEvent(CollectibleTracker.collectedCountUpdatedEvent, (data) =>
        {
            console.log("gold count updated to " + data.count);
            this.goldcount.set(data.count.toString());
        })
        let textureAsset = this.props.coinIcon!.as(TextureAsset);
        let iconSource = ImageSource.fromTextureAsset(textureAsset);
        return View({
            children: [
                View({
                    children: [
                        Image({
                            source: iconSource,
                            style: { width: 40, height: 40, tintColor: 'white' },
                        }),
                        Text({
                            text: this.goldcount,
                            style: { color: 'white', fontSize: 50, textShadowColor: 'black', textShadowRadius: 5, textShadowOffset: [5, 5], textAlignVertical: 'center', fontWeight: 'bold', fontFamily: 'Optimistic', textAlign: 'center' },
                        })
                    ],
                    style: {
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignContent: 'center',
                        alignItems: 'center',
                    }
                })
            ],
            style: {
                alignSelf: 'flex-start',
                top: '85%',
                height: '10%',
                width: '8%',
            }
        });
    }
}

UIComponent.register(CoinUI);
