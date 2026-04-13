import os
import telebot
from dotenv import load_dotenv

load_dotenv()
token = os.getenv('BOT_TOKEN')
bot = telebot.TeleBot(token)

@bot.message_handler(commands=['start'])
def start_message(message):
    bot.send_message(message.chat.id, "Добро пожаловать в PolyDate — сервис для онлайн-знакомств! "
                                      "Здесь ты можешь найти новых друзей, интересных собеседников или свою вторую половинку. "
                                      "Заполни профиль, настрой поиск и начни общение с теми, кто тебе подходит. Приятного знакомства!")

bot.polling(none_stop=True, interval=0)