import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Content, LoadingController } from 'ionic-angular';
import { ChatStorageService} from '../../providers/database/chat-storage-service';
import { UserStorageService } from '../../providers/database/user-storage-service';
import { Utils } from '../../providers/util/utils';

@Component({
  selector: 'page-chat',
  templateUrl: 'chat.html',
})

export class ChatPage {
  @ViewChild(Content) content: Content;

  message;
  listMessages;
  user1;
  user2;
  chat;
  ctrlFloat = true;
  status;


  constructor(
    public navCtrl: NavController,
    public params: NavParams,
    public chatStorageService: ChatStorageService,
    public userStorageService: UserStorageService,
    public loadingCtrl: LoadingController,
    public utils: Utils) {
      this.user1 = this.params.get('user1');
      this.user2 = this.params.get('user2');
      this.chat = this.params.get('chat');
      this.status = this.user2.emotion.is_active;
  }

  ionViewDidLoad() {
    this._getMessages(this.chatStorageService, this.chat, this.content, this.user1, this.utils).then((chat : any) => {
      this.listMessages = chat.messages;
    })
  }

  getClassMsg(uidUser) {
    if(this.user1.$key == uidUser) {
      return 'message1'
    } else if (this.user2.$key == uidUser) {
      return 'message2'
    } else {
      return 'message-status';
    }
  }

 sendMessage() {
   this._validateMessage(this.message, this.content, this.user1, this.user2, this.chatStorageService, this.chat).then((msg) => {
     this.message = "";
   })
 }

 _validateMessage(message, content, user1, user2, chatStorageService, chat) {
    return new Promise((resolve) => {
    let i = 0;
    Promise.resolve(i)
    .then(validateInput)
    .then(msgWrapper)
    .then(sendMessage)
    .then(pushNotification)
    .then(setViewMessage)
    .then(scrollToBottom)
    .then(resolvePromise)

    function validateInput() {
      if (message.trim() !== "") return;
    }

    function msgWrapper() {
      let msgWrapper : any = {
        uid_user : user1.$key,
        msg : message,
        created_at: new Date().getTime(),
      }

      return msgWrapper;
    }

    function sendMessage(msg) {
      chatStorageService.pushMessage(msg, chat.chatUid);
      return msg;
    }

    function pushNotification(msg) {
      msg.token_device = user2.other_datas.token_device;
      msg.name_user = user1.other_datas.name;

      return msg;
    }

    function setViewMessage(msg) {
      chat.users.forEach((user, index) => {
        if(user2.$key === user.uid) {
          chatStorageService.setViewChat(chat.chatKey, index, 0);
        }
      });

      return msg;
    }

    function scrollToBottom(msg) {
      content.scrollToBottom(0);
      return msg;
    }

    function resolvePromise(msg) {
      resolve(msg);
    }

  });
}

_getMessages(chatStorageService, chat, content, user1, utils) {
  return new Promise((resolve) => {
    Promise.resolve()
    .then(getChatDatas)
    .then(getMessages)
    .then(setViewMessage)
    .then(removePushNotification)
    .then(scrollToBottom)
    .then(resolvePromise)

    function getChatDatas() {
      return chat;
    }

    function getMessages(msg) {
      msg.messages = chatStorageService.getMessages(chat.chatUid);
      return msg;
    }

    function setViewMessage(msg) {
      msg.users.forEach((user, index) => {
        if(user1.$key == user.uid) {
          chatStorageService.setViewChat(msg.chatKey, index, 1);
        }
      });

      return msg;
    }

    function removePushNotification(msg) {
      utils.generatePush().then((datas) => {
        console.log("remover o push!");
      }).catch((error) => {

      });

      return msg;
    }

    function scrollToBottom(msg) {
      content.scrollToBottom(0);
      return msg;
    }

    function resolvePromise(msg) {
      resolve(msg)
    }
  });

}


  openGallery() {
    this.utils.openGallery().then((image) => {
      this._sendImg(image);
    }).catch((error) => {
      console.log(error);
    });
  }

  _sendImg(img) {
    let msgWrapper : any = {
      uid_user : this.user1.$key,
      "img" : img,
      created_at: new Date().getTime()
    }

    this.chatStorageService.pushMessage(msgWrapper, this.chat.chatUid);

    msgWrapper.token_device = this.user2.other_datas.token_device;
    msgWrapper.name_user = this.user1.name;
    msgWrapper.msg = "Uma imagem foi enviada!";

    // === Push notification ===
    setTimeout(() => {
        this.chatStorageService.pushNotification(msgWrapper);
        this.content.scrollToBottom(0);
    }, 100);
  }

  _clearStatusEmotion() {
    if(this.status) {
      let status = this.user2.emotion;
      status.is_active = 0;
      this.userStorageService.setEmotion(status, this.user2.$key);
    }
  }


  _generateMessageStaus(name, image, status) {
    this.listMessages.push({
      msg: name + ' está se sentindo ' + status,
      is_status: 1,
      img: image
    });
  }

}
