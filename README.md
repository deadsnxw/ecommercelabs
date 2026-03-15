Щоб запустити проект достатьно у корні проекту прописати (це запустить продакшен версію проекту)  
```
docker-compose -f docker-compose.prod.yml up --build
```
Запустити тести
```
cd backend
```
```
npm test
```
![test](pics/tests.png)  
Health check  
![health1](pics/5305595314779657734.jpg)  
![health2](pics/5305595314779657735.jpg)  
Структуроване логування в JSON (також у цих логах видно graceful shutdown)  
![log](pics/logs.png)
