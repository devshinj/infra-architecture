# 04. 시스템 소프트웨어 · 하드웨어 · 국내 SI 현업 용어 — 용어 사전 후보

조사일: 2026-11-11 / 범위: 망·보안 용어(망분리, VPN 종류, IPS, HSM, SSO 세부 등)는 다른 조사에서 다루므로 뺐습니다.

## 1. 요약

- 후보는 모두 **243개**입니다. 소프트웨어·제품 92개, 하드웨어·물리 인프라 43개, 현업 개념 95개, 프로토콜 13개입니다.
- 제품 항목은 why·compare를 비웠고, 개념·약어·하드웨어·프로토콜 항목은 why·compare를 채웠습니다.
- 지원 종료·이름 변경을 definition에 반영한 제품: CentOS(2024-06-30 종료), HP-UX(2025-12-31 표준 지원 종료), uWSGI(유지보수 모드), Terraform(BSL 전환·IBM 인수), OpenSearch(리눅스 재단 이관), SonarQube(제품명 개편), JBoss EAP/WildFly, Debezium(재단 이관).
- 기존 50개로 설명되지 않는 노드 종류 17개는 모두 이번 후보로 채웠습니다. "망연계 솔루션" 하나만 다른 조사(망·보안) 몫으로 남겼습니다.
- 넣을지 고민되는 것: (1) RAID 0/1/5/6/10을 낱개 항목으로 둘지 "RAID" 하나로 묶을지, (2) 운영계·개발계·검증계·스테이징처럼 서로 짝인 항목을 낱개로 둘지, (3) 국내 특정 업체 제품(Tibero, JEUS, Jennifer, WhaTap 등)을 어디까지 넣을지, (4) HP-UX·Solaris·CentOS처럼 지원이 끝났거나 끝나 가는 제품.
- 출처는 열람 수준을 세 가지로 표시했습니다. **[열람]** 본문을 직접 읽음, **[검색확인]** 검색 결과에 나온 발췌로 확인, **[주소만]** 알려진 공식 주소만 적고 이번 조사에서는 본문을 읽지 않음. [주소만]만 붙은 항목은 사전에 넣기 전에 한 번 더 확인하는 편이 안전합니다.
- 근거가 "—"인 항목은 업계에서 통용되는 뜻을 적은 것이고 특정 문서로 확인하지 않았습니다.

## 2. 용어 사전 후보

적는 모양: `term` — fullName · category / definition / (why / compare) / aliases / 근거(6장 출처 번호).

### 2-A. 소프트웨어·제품 (why·compare 비움)

#### 운영체제

**RHEL** — fullName: Red Hat Enterprise Linux · category: 운영체제 / 리눅스
- definition: RHEL(Red Hat Enterprise Linux)은 레드햇(Red Hat)이 구독 방식으로 기술 지원과 함께 공급하는 기업용 리눅스 배포판입니다.
- aliases: ["redhat", "red hat enterprise linux", "레드햇", "레드햇 리눅스", "렐"] · 근거: [1][38]

**Rocky Linux** — fullName: Rocky Linux · category: 운영체제 / 리눅스
- definition: Rocky Linux는 RESF(Rocky Enterprise Software Foundation)가 주도해 RHEL과 호환되도록 만드는 커뮤니티 기반 무료 기업용 리눅스 배포판입니다.
- aliases: ["rocky", "rockylinux", "록키 리눅스", "로키 리눅스"] · 근거: [38]

**CentOS** — fullName: Community Enterprise Operating System · category: 운영체제 / 리눅스 (지원 종료)
- definition: CentOS(CentOS Linux)는 RHEL과 호환되던 무료 리눅스 배포판으로, 마지막 버전인 7의 지원이 2024년 6월 30일에 끝났고 지금은 RHEL의 개발 단계 판인 CentOS Stream만 이어지고 있습니다.
- aliases: ["centos linux", "centos 7", "centos stream", "센트OS", "센토스"] · 근거: [1]

**Ubuntu** — fullName: Ubuntu (Ubuntu Server) · category: 운영체제 / 리눅스
- definition: Ubuntu는 캐노니컬(Canonical)이 데비안(Debian)을 바탕으로 만드는 리눅스 배포판으로, 2년마다 나오는 장기 지원판(LTS)이 서버와 클라우드에서 널리 쓰입니다.
- aliases: ["ubuntu server", "ubuntu lts", "우분투"] · 근거: [38]

**Windows Server** — fullName: Microsoft Windows Server · category: 운영체제 / 윈도우
- definition: Windows Server는 마이크로소프트(Microsoft)가 만드는 서버용 운영체제로, Active Directory·IIS·Hyper-V 같은 서버 기능을 함께 제공하는 상용 제품입니다.
- aliases: ["windows", "win server", "윈도우 서버", "윈도 서버", "윈도우즈 서버"] · 근거: [26][38]

**AIX** — fullName: Advanced Interactive eXecutive · category: 운영체제 / 유닉스
- definition: AIX는 IBM이 자사 Power 서버용으로 만드는 상용 유닉스(UNIX) 운영체제입니다.
- aliases: ["ibm aix", "에이아이엑스"] · 근거: [38]

**HP-UX** — fullName: Hewlett Packard UniX · category: 운영체제 / 유닉스 (표준 지원 종료)
- definition: HP-UX는 HPE(구 HP)가 자사 Integrity·HP 9000 서버용으로 만든 상용 유닉스 운영체제로, 마지막 버전인 11i v3의 표준 지원이 2025년 12월 31일에 끝났습니다.
- aliases: ["hpux", "hp ux", "hp-ux 11i", "에이치피유엑스"] · 근거: [2]

**Solaris** — fullName: Oracle Solaris · category: 운영체제 / 유닉스
- definition: Solaris는 썬 마이크로시스템즈가 만들고 지금은 오라클(Oracle)이 공급하는 상용 유닉스 운영체제로, SPARC와 x86 서버에서 동작하며 현재 버전은 11.4입니다.
- aliases: ["oracle solaris", "sunos", "솔라리스"] · 근거: [18]

#### 웹 서버 · WAS · 실행 환경

**IIS** — fullName: Internet Information Services · category: 웹 서버
- definition: IIS(Internet Information Services)는 마이크로소프트가 Windows Server에 포함해 제공하는 웹 서버로, ASP.NET 애플리케이션을 실행하는 데 주로 쓰입니다.
- aliases: ["internet information services", "microsoft iis", "아이아이에스"] · 근거: [38]

**WebtoB** — fullName: WebtoB · category: 웹 서버
- definition: WebtoB는 티맥스소프트(TmaxSoft)가 만든 상용 웹 서버로, 같은 회사의 WAS인 JEUS와 짝을 이루어 국내 공공·금융 시스템에서 많이 쓰입니다.
- aliases: ["webtob", "web2b", "웹투비"] · 근거: [19]

**JEUS** — fullName: Java Enterprise User Solution · category: WAS / 서블릿 컨테이너
- definition: JEUS(Java Enterprise User Solution)는 티맥스소프트(TmaxSoft)가 만든 상용 자바 웹 애플리케이션 서버(WAS)로, Java EE(Jakarta EE) 표준을 따릅니다.
- aliases: ["jeus", "tmax jeus", "제우스"] · 근거: [19]

**WebLogic** — fullName: Oracle WebLogic Server · category: WAS / 서블릿 컨테이너
- definition: WebLogic(Oracle WebLogic Server)은 오라클(Oracle)이 공급하는 상용 자바 웹 애플리케이션 서버(WAS)로, BEA Systems가 만들던 제품을 오라클이 인수했습니다.
- aliases: ["weblogic server", "oracle weblogic", "wls", "웹로직"] · 근거: [38]

**WebSphere** — fullName: IBM WebSphere Application Server · category: WAS / 서블릿 컨테이너
- definition: WebSphere(IBM WebSphere Application Server)는 IBM이 공급하는 상용 자바 웹 애플리케이션 서버(WAS)로, 전통(traditional) 판과 가벼운 Liberty 판이 있습니다.
- aliases: ["websphere application server", "ibm was", "websphere liberty", "웹스피어"] · 근거: [38]

**JBoss EAP** — fullName: Red Hat JBoss Enterprise Application Platform · category: WAS / 서블릿 컨테이너
- definition: JBoss EAP(Red Hat JBoss Enterprise Application Platform)는 오픈소스 WildFly를 바탕으로 레드햇이 구독 방식으로 기술 지원을 붙여 공급하는 자바 웹 애플리케이션 서버(WAS)입니다.
- aliases: ["jboss", "jboss eap", "jboss as", "제이보스"] · 근거: [27]

**WildFly** — fullName: WildFly (구 JBoss Application Server) · category: WAS / 서블릿 컨테이너
- definition: WildFly는 예전에 JBoss AS라고 부르던 오픈소스 자바 웹 애플리케이션 서버(WAS)로, 상용 제품인 JBoss EAP의 바탕이 되는 커뮤니티 프로젝트입니다.
- aliases: ["wildfly", "jboss as", "와일드플라이"] · 근거: [27]

**OHS** — fullName: Oracle HTTP Server · category: 웹 서버
- definition: OHS(Oracle HTTP Server)는 오라클이 Apache HTTP Server를 바탕으로 만들어 Oracle Fusion Middleware에 포함해 제공하는 웹 서버로, 주로 WebLogic 앞단에 둡니다.
- aliases: ["oracle http server", "오에이치에스"] · 근거: [38]

**Spring Boot** — fullName: Spring Boot (내장 톰캣) · category: 애플리케이션 프레임워크 / 내장 WAS
- definition: Spring Boot는 자바 스프링(Spring) 애플리케이션을 Tomcat 같은 서블릿 컨테이너를 안에 품은 실행 파일 하나로 만들어 띄우게 해 주는 오픈소스 프레임워크입니다.
- aliases: ["springboot", "spring", "embedded tomcat", "내장 톰캣", "스프링 부트", "스프링부트"] · 근거: [38]

**Node.js** — fullName: Node.js · category: 애플리케이션 런타임
- definition: Node.js는 크롬의 V8 엔진으로 자바스크립트(JavaScript)를 서버에서 실행하는 오픈소스 런타임으로, OpenJS Foundation이 관리합니다.
- aliases: ["node", "nodejs", "노드", "노드제이에스"] · 근거: [38]

**PM2** — fullName: Process Manager 2 · category: 프로세스 관리자
- definition: PM2는 Node.js 애플리케이션을 백그라운드로 띄우고 죽으면 다시 살리며 여러 프로세스로 나누어 실행해 주는 오픈소스 프로세스 관리자입니다.
- aliases: ["pm2", "피엠투"] · 근거: [38]

**Gunicorn** — fullName: Green Unicorn · category: WAS / 파이썬 WSGI 서버
- definition: Gunicorn(Green Unicorn)은 파이썬(Python) 웹 애플리케이션을 WSGI 규격으로 실행하는 오픈소스 HTTP 서버로, 미리 띄워 둔 워커 프로세스들이 요청을 나누어 처리합니다.
- aliases: ["gunicorn", "green unicorn", "구니콘", "지유니콘"] · 근거: [13]

**uWSGI** — fullName: uWSGI · category: WAS / 파이썬 WSGI 서버 (유지보수 모드)
- definition: uWSGI는 파이썬 웹 애플리케이션을 WSGI 규격으로 실행하는 오픈소스 애플리케이션 서버로, 지금은 버그 수정만 하는 유지보수 모드라고 공식 문서가 밝히고 있습니다.
- aliases: ["uwsgi", "유위스기"] · 근거: [13]

#### 데이터베이스

**MariaDB** — fullName: MariaDB Server · category: 관계형 DB
- definition: MariaDB는 MySQL에서 갈라져 나온 오픈소스 관계형 데이터베이스(RDBMS)로, MySQL과 명령과 접속 방식이 거의 같습니다.
- aliases: ["mariadb", "maria db", "마리아DB", "마리아디비"] · 근거: [38]

**MS SQL Server** — fullName: Microsoft SQL Server · category: 관계형 DB
- definition: MS SQL Server(Microsoft SQL Server)는 마이크로소프트가 만드는 상용 관계형 데이터베이스(RDBMS)로, Windows Server와 리눅스에서 동작합니다.
- aliases: ["mssql", "sql server", "sqlserver", "엠에스에스큐엘", "MS SQL"] · 근거: [38]

**Tibero** — fullName: Tibero RDBMS · category: 관계형 DB
- definition: Tibero는 티맥스티베로(TmaxTibero)가 만든 국산 상용 관계형 데이터베이스(RDBMS)로, Oracle과 SQL 문법 호환성이 높아 국내 공공·금융에서 대체 제품으로 쓰입니다.
- aliases: ["tibero", "tmax tibero", "티베로"] · 근거: [3]

**Altibase** — fullName: Altibase · category: 관계형 DB / 인메모리
- definition: Altibase는 알티베이스(Altibase)가 만든 국산 관계형 데이터베이스(RDBMS)로, 메모리 테이블과 디스크 테이블을 함께 쓰는 하이브리드 구조입니다.
- aliases: ["altibase", "altibase hdb", "알티베이스"] · 근거: [4]

**CUBRID** — fullName: CUBRID · category: 관계형 DB
- definition: CUBRID는 큐브리드(CUBRID)가 개발을 이끄는 국산 오픈소스 관계형 데이터베이스(RDBMS)로, 라이선스 비용이 없어 국내 공공기관에서 많이 쓰입니다.
- aliases: ["cubrid", "큐브리드"] · 근거: [20]

**Db2** — fullName: IBM Db2 · category: 관계형 DB
- definition: Db2(IBM Db2)는 IBM이 만드는 상용 관계형 데이터베이스(RDBMS)로, 메인프레임·유닉스·리눅스·윈도우에서 동작합니다.
- aliases: ["db2", "ibm db2", "udb", "디비투"] · 근거: [38]

**Oracle RAC** — fullName: Oracle Real Application Clusters · category: 관계형 DB / 클러스터
- definition: Oracle RAC(Real Application Clusters)는 여러 대의 서버가 같은 저장소의 Oracle 데이터베이스 하나를 동시에 열어 서비스하게 하는 Oracle Database의 클러스터 기능입니다.
- aliases: ["rac", "real application clusters", "오라클 랙", "랙"] · 근거: [38]

**Oracle Data Guard** — fullName: Oracle Data Guard · category: 관계형 DB / 복제·재해복구
- definition: Oracle Data Guard는 운영 Oracle 데이터베이스의 변경 기록을 대기(Standby) 데이터베이스로 계속 보내 같은 상태로 유지하는 Oracle Database의 복제·재해복구 기능입니다.
- aliases: ["data guard", "dataguard", "adg", "active data guard", "데이터 가드"] · 근거: [38]

**Aurora** — fullName: Amazon Aurora · category: 관계형 DB / 클라우드 관리형
- definition: Aurora(Amazon Aurora)는 AWS가 제공하는 관리형 관계형 데이터베이스로, MySQL·PostgreSQL과 호환되며 저장소를 여러 가용 영역에 자동으로 복제합니다.
- aliases: ["amazon aurora", "aws aurora", "aurora mysql", "aurora postgresql", "오로라"] · 근거: [35]

**RDS** — fullName: Amazon Relational Database Service · category: 관계형 DB / 클라우드 관리형
- definition: RDS(Amazon Relational Database Service)는 MySQL·PostgreSQL·Oracle·SQL Server 같은 관계형 데이터베이스의 설치·백업·패치를 AWS가 대신 해 주는 관리형 서비스입니다.
- aliases: ["amazon rds", "aws rds", "알디에스"] · 근거: [35]

**DynamoDB** — fullName: Amazon DynamoDB · category: NoSQL DB / 클라우드 관리형
- definition: DynamoDB(Amazon DynamoDB)는 AWS가 제공하는 서버리스 방식의 관리형 NoSQL 데이터베이스로, 키-값과 문서 형태의 데이터를 저장합니다.
- aliases: ["amazon dynamodb", "dynamo", "다이나모DB", "다이나모디비"] · 근거: [35]

**Cassandra** — fullName: Apache Cassandra · category: NoSQL DB / 와이드 컬럼
- definition: Cassandra(Apache Cassandra)는 여러 서버에 데이터를 나누어 저장하고 주(Master) 서버 없이 동작하는 오픈소스 분산 NoSQL 데이터베이스입니다.
- aliases: ["apache cassandra", "카산드라"] · 근거: [38]

**HBase** — fullName: Apache HBase · category: NoSQL DB / 와이드 컬럼
- definition: HBase(Apache HBase)는 하둡(Hadoop)의 분산 파일 시스템 위에서 아주 큰 표 형태의 데이터를 저장하는 오픈소스 분산 NoSQL 데이터베이스입니다.
- aliases: ["apache hbase", "에이치베이스"] · 근거: [38]

**InfluxDB** — fullName: InfluxDB · category: 시계열 DB
- definition: InfluxDB는 인플럭스데이터(InfluxData)가 만드는 시계열 데이터베이스로, 시간 순서로 쌓이는 측정값(모니터링 지표, 센서 값)을 저장하고 조회하는 데 맞춰져 있습니다.
- aliases: ["influx", "influxdb", "인플럭스DB", "인플럭스디비"] · 근거: [38] (라이선스는 판마다 달라 미확인)

**OpenSearch** — fullName: OpenSearch · category: 검색 엔진
- definition: OpenSearch는 Elasticsearch 7.10.2에서 갈라져 나온 Apache 2.0 라이선스의 오픈소스 검색·분석 엔진으로, 2024년부터 리눅스 재단 산하 OpenSearch Software Foundation이 관리합니다.
- aliases: ["opensearch", "amazon opensearch", "오픈서치"] · 근거: [6]

**Memcached** — fullName: Memcached · category: 캐시 / 인메모리
- definition: Memcached는 키와 값을 메모리에만 저장하는 오픈소스 분산 캐시 서버로, 구조가 단순하고 데이터를 디스크에 남기지 않습니다.
- aliases: ["memcache", "memcached", "멤캐시드", "멤캐시"] · 근거: [38]

#### 미들웨어 · 연계 · 배치

**Tuxedo** — fullName: Oracle Tuxedo · category: 미들웨어 / TP 모니터
- definition: Tuxedo(Oracle Tuxedo)는 오라클이 공급하는 상용 TP 모니터(트랜잭션 처리 미들웨어)로, C·COBOL로 만든 업무 서비스의 분산 트랜잭션을 관리합니다.
- aliases: ["oracle tuxedo", "bea tuxedo", "턱시도"] · 근거: [29]

**Tmax** — fullName: Tmax (TP 모니터) · category: 미들웨어 / TP 모니터
- definition: Tmax는 티맥스소프트(TmaxSoft)가 1997년에 내놓은 국산 상용 TP 모니터(트랜잭션 처리 미들웨어)로, 국내 금융권 계정계에서 많이 쓰입니다.
- aliases: ["tmax", "티맥스"] · 근거: [19]

**ActiveMQ** — fullName: Apache ActiveMQ · category: 큐 / 메시지 브로커
- definition: ActiveMQ(Apache ActiveMQ)는 자바 메시지 표준(JMS)을 따르는 오픈소스 메시지 브로커로, 시스템 사이에 메시지를 큐에 담아 전달합니다.
- aliases: ["apache activemq", "activemq artemis", "액티브MQ", "액티브엠큐"] · 근거: [38]

**IBM MQ** — fullName: IBM MQ (구 WebSphere MQ, MQSeries) · category: 큐 / 메시지 브로커
- definition: IBM MQ는 IBM이 공급하는 상용 메시지 큐 미들웨어로, 예전 이름은 MQSeries·WebSphere MQ이며 금융권 시스템 연계에 오래 쓰여 왔습니다.
- aliases: ["mq", "websphere mq", "mqseries", "아이비엠 엠큐"] · 근거: [38]

**Control-M** — fullName: BMC Control-M · category: 배치 스케줄러
- definition: Control-M은 BMC가 공급하는 상용 작업 자동화(배치 스케줄러) 제품으로, 여러 서버의 배치 작업을 순서와 시간에 맞춰 실행하고 결과를 한곳에서 관리합니다.
- aliases: ["controlm", "ctm", "bmc control-m", "컨트롤엠"] · 근거: [38]

**Quartz** — fullName: Quartz Job Scheduler · category: 배치 스케줄러 / 라이브러리
- definition: Quartz는 자바 애플리케이션 안에서 정해진 시각이나 주기에 작업을 실행하게 해 주는 오픈소스 작업 스케줄링 라이브러리입니다.
- aliases: ["quartz scheduler", "쿼츠"] · 근거: [38]

**Airflow** — fullName: Apache Airflow · category: 배치 스케줄러 / 워크플로
- definition: Airflow(Apache Airflow)는 여러 단계로 이어지는 데이터 처리 작업의 순서와 일정을 파이썬 코드로 정의해 실행하고 감시하는 오픈소스 워크플로 관리 도구입니다.
- aliases: ["apache airflow", "에어플로", "에어플로우"] · 근거: [38]

**Oracle GoldenGate** — fullName: Oracle GoldenGate · category: 데이터 복제 / CDC
- definition: Oracle GoldenGate는 데이터베이스의 변경 기록을 읽어 다른 데이터베이스로 실시간에 가깝게 복제하는 오라클의 상용 데이터 복제(CDC) 제품입니다.
- aliases: ["goldengate", "ogg", "골든게이트"] · 근거: [38]

**Debezium** — fullName: Debezium · category: 데이터 복제 / CDC
- definition: Debezium은 데이터베이스의 변경 내용을 읽어 Kafka 같은 스트림으로 내보내는 오픈소스 변경 데이터 캡처(CDC) 도구로, 레드햇에서 시작해 지금은 Commonhaus 재단 소속입니다.
- aliases: ["debezium", "데비지움"] · 근거: [15]

#### 가상화 · 컨테이너

**VMware vSphere** — fullName: VMware vSphere · category: 가상화 플랫폼
- definition: VMware vSphere는 브로드컴(Broadcom)에 인수된 VMware의 서버 가상화 플랫폼으로, 하이퍼바이저인 ESXi와 관리 서버인 vCenter로 이루어집니다.
- aliases: ["vsphere", "vmware", "브이스피어", "VM웨어", "브이엠웨어"] · 근거: [12]

**ESXi** — fullName: VMware ESXi · category: 가상화 / 하이퍼바이저
- definition: ESXi(VMware ESXi)는 물리 서버에 운영체제 없이 직접 설치해 그 위에 여러 가상 머신을 띄우는 VMware의 하이퍼바이저입니다.
- aliases: ["vmware esxi", "esx", "이에스엑스아이"] · 근거: [12]

**vCenter** — fullName: VMware vCenter Server · category: 가상화 / 관리 서버
- definition: vCenter(VMware vCenter Server)는 여러 ESXi 호스트와 그 위의 가상 머신을 한 화면에서 관리하고 호스트 사이로 가상 머신을 옮기게 해 주는 VMware의 중앙 관리 서버입니다.
- aliases: ["vcenter server", "vcsa", "브이센터"] · 근거: [12]

**Hyper-V** — fullName: Microsoft Hyper-V · category: 가상화 / 하이퍼바이저
- definition: Hyper-V는 마이크로소프트가 Windows Server에 포함해 제공하는 하이퍼바이저로, 물리 서버 한 대에 여러 가상 머신을 띄웁니다.
- aliases: ["hyperv", "hyper v", "하이퍼브이", "하이퍼V"] · 근거: [38]

**KVM** — fullName: Kernel-based Virtual Machine · category: 가상화 / 하이퍼바이저
- definition: KVM(Kernel-based Virtual Machine)은 리눅스 커널에 들어 있는 오픈소스 가상화 기능으로, 리눅스 서버를 하이퍼바이저로 만들어 가상 머신을 띄웁니다.
- aliases: ["kernel-based virtual machine", "qemu-kvm", "케이브이엠"] · 근거: [38] (KVM 스위치와는 다른 말입니다 — 2-B 참고)

**OpenStack** — fullName: OpenStack · category: 클라우드 플랫폼 / IaaS
- definition: OpenStack은 자체 데이터센터의 서버·저장소·네트워크를 묶어 사설 클라우드(IaaS)로 운영하게 해 주는 오픈소스 클라우드 플랫폼으로, OpenInfra 재단(2025년 리눅스 재단 합류)이 관리합니다.
- aliases: ["openstack", "오픈스택"] · 근거: [17]

**Docker** — fullName: Docker (Docker Engine) · category: 컨테이너 / 실행 도구
- definition: Docker는 애플리케이션과 실행에 필요한 것들을 컨테이너 이미지로 묶고 그 이미지를 컨테이너로 실행하는 도구로, 도커(Docker, Inc.)가 만듭니다.
- aliases: ["docker engine", "dockerd", "도커"] · 근거: [38]

**containerd** — fullName: containerd · category: 컨테이너 / 런타임
- definition: containerd는 컨테이너 이미지를 내려받고 컨테이너를 실행·관리하는 오픈소스 컨테이너 런타임으로, CNCF 졸업 프로젝트이며 쿠버네티스의 기본 런타임으로 많이 쓰입니다.
- aliases: ["containerd", "컨테이너디"] · 근거: [24]

**OpenShift** — fullName: Red Hat OpenShift · category: 컨테이너 플랫폼 / 쿠버네티스 배포판
- definition: OpenShift(Red Hat OpenShift)는 레드햇이 쿠버네티스에 빌드·배포·보안·관리 기능을 더해 구독 방식으로 공급하는 기업용 컨테이너 플랫폼입니다.
- aliases: ["openshift", "ocp", "openshift container platform", "오픈시프트"] · 근거: [38]

**Helm** — fullName: Helm · category: 쿠버네티스 / 패키지 관리
- definition: Helm은 쿠버네티스에 올릴 설정 묶음을 차트(Chart)라는 패키지로 만들어 설치·업그레이드·되돌리기를 하게 해 주는 오픈소스 패키지 관리 도구로, CNCF 졸업 프로젝트입니다.
- aliases: ["helm chart", "헬름"] · 근거: [24]

**Rancher** — fullName: SUSE Rancher · category: 쿠버네티스 / 클러스터 관리
- definition: Rancher는 여러 곳에 있는 쿠버네티스 클러스터를 한 화면에서 만들고 관리하게 해 주는 오픈소스 관리 플랫폼으로, 수세(SUSE)가 공급합니다.
- aliases: ["suse rancher", "rke", "랜처"] · 근거: [38]

**Istio** — fullName: Istio · category: 쿠버네티스 / 서비스 메시
- definition: Istio는 쿠버네티스 안의 서비스들 사이 통신을 프록시로 가로채 암호화·경로 제어·관측을 해 주는 오픈소스 서비스 메시로, CNCF 졸업 프로젝트입니다.
- aliases: ["istio", "이스티오"] · 근거: [24]

**Harbor** — fullName: Harbor · category: 컨테이너 / 이미지 레지스트리
- definition: Harbor는 컨테이너 이미지를 사내에 저장하고 접근 권한 관리와 취약점 검사를 해 주는 오픈소스 컨테이너 이미지 레지스트리로, CNCF 졸업 프로젝트입니다.
- aliases: ["harbor registry", "하버"] · 근거: [24]

#### 운영 도구 (빌드·배포·구성·모니터링)

**Jenkins** — fullName: Jenkins · category: CI/CD / 자동화 서버
- definition: Jenkins는 코드 빌드·테스트·배포 과정을 자동으로 돌려 주는 오픈소스 자동화 서버입니다.
- aliases: ["jenkins", "젠킨스"] · 근거: [38]

**GitLab** — fullName: GitLab · category: 형상관리 / CI/CD
- definition: GitLab은 Git 소스 저장소와 코드 리뷰, CI/CD 파이프라인을 한 제품으로 제공하는 개발 플랫폼으로, 사내에 직접 설치해 쓸 수도 있습니다.
- aliases: ["gitlab ci", "gitlab ce", "깃랩"] · 근거: [38]

**Argo CD** — fullName: Argo CD · category: CI/CD / 쿠버네티스 배포
- definition: Argo CD는 Git 저장소에 적힌 설정과 쿠버네티스 클러스터의 실제 상태를 맞춰 주는 방식(GitOps)으로 배포하는 오픈소스 도구로, CNCF 졸업 프로젝트 Argo의 일부입니다.
- aliases: ["argocd", "argo", "아르고CD", "아르고 씨디"] · 근거: [24]

**Ansible** — fullName: Red Hat Ansible · category: 구성 관리 / 자동화
- definition: Ansible은 서버에 별도 프로그램(에이전트)을 깔지 않고 SSH로 접속해 설치·설정 작업을 자동으로 수행하는 오픈소스 자동화 도구로, 레드햇이 주도합니다.
- aliases: ["ansible", "ansible playbook", "앤서블", "앤시블"] · 근거: [38]

**Terraform** — fullName: HashiCorp Terraform · category: 인프라 코드(IaC)
- definition: Terraform은 클라우드와 인프라 자원을 코드로 적어 만들고 바꾸는 하시코프(HashiCorp, 2025년 IBM 인수)의 도구로, 2023년에 라이선스가 오픈소스(MPL)에서 BSL로 바뀌었습니다.
- aliases: ["terraform", "tf", "hashicorp terraform", "테라폼"] · 근거: [5]

**Prometheus** — fullName: Prometheus · category: 모니터링 / 메트릭
- definition: Prometheus는 서버와 애플리케이션의 수치 지표(메트릭)를 주기적으로 가져와 시계열로 저장하고 조건에 맞으면 알림을 보내는 오픈소스 모니터링 시스템으로, CNCF 졸업 프로젝트입니다.
- aliases: ["prometheus", "프로메테우스"] · 근거: [24]

**Grafana** — fullName: Grafana · category: 모니터링 / 대시보드
- definition: Grafana는 Prometheus 같은 여러 데이터 저장소의 지표와 로그를 그래프 대시보드로 보여 주는 오픈소스 시각화 도구로, 그라파나 랩스(Grafana Labs)가 만듭니다.
- aliases: ["grafana", "그라파나"] · 근거: [38]

**Zabbix** — fullName: Zabbix · category: 모니터링 / 인프라
- definition: Zabbix는 서버·네트워크 장비·애플리케이션의 상태를 수집해 감시하고 알림을 보내는 오픈소스 인프라 모니터링 도구로, 7.0부터 AGPLv3 라이선스로 배포됩니다.
- aliases: ["zabbix", "자빅스"] · 근거: [25]

**Nagios** — fullName: Nagios (Nagios Core) · category: 모니터링 / 인프라
- definition: Nagios는 서버와 네트워크 서비스가 살아 있는지 주기적으로 확인해 문제가 생기면 알림을 보내는 인프라 모니터링 도구로, 오픈소스인 Nagios Core와 상용 Nagios XI가 있습니다.
- aliases: ["nagios core", "nagios xi", "나기오스"] · 근거: [38]

**ELK 스택** — fullName: Elasticsearch · Logstash · Kibana (Elastic Stack) · category: 로깅 / 로그 수집·검색
- definition: ELK 스택은 로그를 모으는 Logstash, 저장·검색하는 Elasticsearch, 화면으로 보여 주는 Kibana를 묶어 부르는 이름으로, 엘라스틱(Elastic)은 Elastic Stack이라고 부릅니다.
- aliases: ["elk", "elastic stack", "엘크", "엘라스틱 스택"] · 근거: [38]

**EFK 스택** — fullName: Elasticsearch · Fluentd · Kibana · category: 로깅 / 로그 수집·검색
- definition: EFK 스택은 ELK 스택에서 로그 수집기 Logstash를 Fluentd(또는 Fluent Bit)로 바꾼 구성으로, 쿠버네티스 환경의 로그 수집에 많이 쓰입니다.
- aliases: ["efk", "이에프케이"] · 근거: [24][38]

**Logstash** — fullName: Logstash · category: 로깅 / 로그 수집기
- definition: Logstash는 여러 곳의 로그를 받아 형식을 바꾼 뒤 Elasticsearch 같은 저장소로 보내는 엘라스틱(Elastic)의 로그 수집·가공 도구입니다.
- aliases: ["logstash", "로그스태시"] · 근거: [38]

**Kibana** — fullName: Kibana · category: 로깅 / 대시보드
- definition: Kibana는 Elasticsearch에 쌓인 로그와 데이터를 검색하고 그래프로 보여 주는 엘라스틱(Elastic)의 화면 도구입니다.
- aliases: ["kibana", "키바나"] · 근거: [38]

**Fluentd** — fullName: Fluentd · category: 로깅 / 로그 수집기
- definition: Fluentd는 여러 곳에서 나오는 로그를 한 형식으로 모아 원하는 저장소로 보내는 오픈소스 로그 수집기로, CNCF 졸업 프로젝트입니다.
- aliases: ["fluentd", "fluent bit", "플루언트디"] · 근거: [24]

**Scouter** — fullName: Scouter · category: 모니터링 / APM
- definition: Scouter는 LG CNS가 공개한 오픈소스 애플리케이션 성능 모니터링(APM) 도구로, 주로 자바 WAS의 응답 시간과 처리량을 실시간으로 보여 줍니다.
- aliases: ["scouter", "스카우터"] · 근거: [21]

**Jennifer** — fullName: JENNIFER · category: 모니터링 / APM
- definition: Jennifer(JENNIFER)는 제니퍼소프트(JenniferSoft)가 만든 국산 상용 애플리케이션 성능 모니터링(APM) 제품으로, Java·.NET·PHP 웹 애플리케이션의 상태를 실시간으로 보여 줍니다.
- aliases: ["jennifer", "jennifer apm", "제니퍼"] · 근거: [28]

**Pinpoint** — fullName: Pinpoint · category: 모니터링 / APM
- definition: Pinpoint는 네이버가 공개한 Apache 2.0 라이선스의 오픈소스 애플리케이션 성능 모니터링(APM) 도구로, 여러 서버를 거치는 요청의 흐름을 추적해 보여 줍니다.
- aliases: ["pinpoint", "naver pinpoint", "핀포인트"] · 근거: [21]

**WhaTap** — fullName: WhaTap Monitoring · category: 모니터링 / 통합 모니터링(SaaS)
- definition: WhaTap은 와탭랩스(WhaTap Labs)가 제공하는 국산 모니터링 서비스로, 애플리케이션·서버·데이터베이스·쿠버네티스 상태를 구독형(SaaS)으로 보여 줍니다.
- aliases: ["whatap", "와탭"] · 근거: [38] (이번 조사에서 공식 문서 미확인)

**Datadog** — fullName: Datadog · category: 모니터링 / 통합 모니터링(SaaS)
- definition: Datadog은 서버·애플리케이션·로그의 상태를 한곳에 모아 보여 주는 데이터독(Datadog)의 구독형(SaaS) 통합 모니터링 서비스입니다.
- aliases: ["datadog", "데이터독"] · 근거: [38]

**Sentry** — fullName: Sentry · category: 모니터링 / 오류 추적
- definition: Sentry는 애플리케이션에서 난 오류를 모아 원인 위치와 함께 알려 주는 오류 추적 서비스로, 소스는 공개되어 있지만 FSL이라는 경쟁 금지 조건의 라이선스를 씁니다.
- aliases: ["sentry", "센트리"] · 근거: [30]

**Nexus** — fullName: Sonatype Nexus Repository · category: 아티팩트 저장소
- definition: Nexus(Sonatype Nexus Repository)는 빌드 결과물과 외부 라이브러리(Maven, npm, Docker 이미지 등)를 사내에 저장하고 내려받게 해 주는 소나타입(Sonatype)의 저장소 관리 제품입니다.
- aliases: ["nexus repository", "nexus oss", "sonatype nexus", "넥서스"] · 근거: [38]

**SonarQube** — fullName: SonarQube (SonarQube Server / Community Build) · category: 코드 품질 / 정적 분석
- definition: SonarQube는 소스 코드를 자동으로 검사해 버그·보안 취약점·코드 품질 문제를 찾아 주는 소나(Sonar)의 정적 분석 도구로, 2024년부터 설치형은 SonarQube Server와 Community Build로 이름이 나뉘었습니다.
- aliases: ["sonarqube", "sonar", "sonarqube server", "소나큐브"] · 근거: [14]

#### 클라우드 관리형 서비스 (AWS 이름 — 다른 클라우드의 대응 이름은 3장)

**EC2** — fullName: Amazon Elastic Compute Cloud · category: 클라우드 / 가상 서버
- definition: EC2(Amazon Elastic Compute Cloud)는 AWS에서 필요한 사양의 가상 서버(인스턴스)를 만들어 쓰고 쓴 만큼 요금을 내는 서비스입니다.
- aliases: ["amazon ec2", "ec2 instance", "이씨투"] · 근거: [35]

**EBS** — fullName: Amazon Elastic Block Store · category: 클라우드 / 블록 스토리지
- definition: EBS(Amazon Elastic Block Store)는 EC2 가상 서버에 디스크처럼 붙여 쓰는 AWS의 블록 스토리지 서비스입니다.
- aliases: ["amazon ebs", "ebs volume", "이비에스"] · 근거: [35]

**EFS** — fullName: Amazon Elastic File System · category: 클라우드 / 파일 스토리지
- definition: EFS(Amazon Elastic File System)는 여러 서버가 NFS로 동시에 붙어 같은 파일을 읽고 쓰는 AWS의 관리형 파일 스토리지 서비스입니다.
- aliases: ["amazon efs", "이에프에스"] · 근거: [35]

**EKS** — fullName: Amazon Elastic Kubernetes Service · category: 클라우드 / 관리형 쿠버네티스
- definition: EKS(Amazon Elastic Kubernetes Service)는 쿠버네티스의 관리 영역(컨트롤 플레인)을 AWS가 대신 운영해 주는 관리형 쿠버네티스 서비스입니다.
- aliases: ["amazon eks", "이케이에스"] · 근거: [35]

**ECS** — fullName: Amazon Elastic Container Service · category: 클라우드 / 컨테이너 실행
- definition: ECS(Amazon Elastic Container Service)는 쿠버네티스 없이 AWS 고유의 방식으로 컨테이너를 배치·실행·확장해 주는 관리형 컨테이너 서비스입니다.
- aliases: ["amazon ecs", "이씨에스"] · 근거: [35]

**Fargate** — fullName: AWS Fargate · category: 클라우드 / 서버리스 컨테이너
- definition: Fargate(AWS Fargate)는 ECS나 EKS의 컨테이너를 사용자가 서버를 관리하지 않고 실행하게 해 주는 AWS의 서버리스 컨테이너 실행 환경입니다.
- aliases: ["aws fargate", "파게이트"] · 근거: [35]

**ElastiCache** — fullName: Amazon ElastiCache · category: 클라우드 / 관리형 캐시
- definition: ElastiCache(Amazon ElastiCache)는 Redis·Valkey·Memcached 호환 인메모리 캐시를 AWS가 설치·운영해 주는 관리형 캐시 서비스입니다.
- aliases: ["amazon elasticache", "엘라스티캐시"] · 근거: [35]

**CloudFront** — fullName: Amazon CloudFront · category: 클라우드 / CDN
- definition: CloudFront(Amazon CloudFront)는 사용자와 가까운 거점에서 콘텐츠를 대신 전달하는 AWS의 콘텐츠 전송 네트워크(CDN) 서비스입니다.
- aliases: ["amazon cloudfront", "클라우드프론트"] · 근거: [35]

**Route 53** — fullName: Amazon Route 53 · category: 클라우드 / DNS
- definition: Route 53(Amazon Route 53)은 도메인 이름을 IP 주소로 바꿔 주고 서버 상태에 따라 접속 경로를 바꿀 수 있는 AWS의 관리형 DNS 서비스입니다.
- aliases: ["route53", "amazon route 53", "라우트53", "라우트 53"] · 근거: [35]

**Amazon API Gateway** — fullName: Amazon API Gateway · category: 클라우드 / API 게이트웨이
- definition: Amazon API Gateway는 API 요청을 받아 인증·사용량 제한을 적용한 뒤 Lambda나 뒷단 서버로 넘겨 주는 AWS의 관리형 API 게이트웨이 서비스입니다.
- aliases: ["aws api gateway", "apigw", "API 게이트웨이(AWS)"] · 근거: [35]

**CloudWatch** — fullName: Amazon CloudWatch · category: 클라우드 / 모니터링·로깅
- definition: CloudWatch(Amazon CloudWatch)는 AWS 자원의 지표와 로그를 모아 그래프로 보여 주고 조건에 맞으면 알림을 보내는 AWS의 모니터링 서비스입니다.
- aliases: ["amazon cloudwatch", "cloudwatch logs", "클라우드워치"] · 근거: [35]

### 2-B. 하드웨어 · 물리 인프라 (why·compare 채움)

#### 서버 · 부품

**랙 서버** — fullName: 랙 마운트 서버(Rack-mount Server) · category: 하드웨어 / 서버
- definition: 랙 서버는 표준 폭 19인치의 장비 선반(랙)에 층층이 끼워 넣도록 납작하게 만든 서버입니다.
- why: 좁은 전산실 공간에 서버를 많이 넣고 전원·케이블을 정리하기 쉽게 합니다.
- compare: 랙 서버는 한 대가 전원과 팬을 따로 갖고, 블레이드 서버는 여러 대가 한 틀의 전원과 팬을 나눠 씁니다.
- aliases: ["rack server", "rackmount", "랙마운트 서버", "1U 서버", "2U 서버"] · 근거: [41]

**블레이드 서버** — fullName: 블레이드 서버(Blade Server) · category: 하드웨어 / 서버
- definition: 블레이드 서버는 얇은 카드 모양의 서버 여러 장을 전원·냉각·네트워크를 함께 쓰는 틀(섀시)에 꽂아 쓰는 서버입니다.
- why: 같은 공간에 더 많은 서버를 넣고 케이블 수를 줄입니다.
- compare: 블레이드 서버는 섀시가 있어야 동작하고, 랙 서버는 한 대만으로 동작합니다.
- aliases: ["blade server", "blade", "블레이드", "섀시"] · 근거: —

**타워 서버** — fullName: 타워형 서버(Tower Server) · category: 하드웨어 / 서버
- definition: 타워 서버는 데스크톱 PC 본체처럼 세워 두는 모양의 서버입니다.
- why: 랙이나 전산실이 없는 작은 사무실에서 서버를 한두 대 둘 때 씁니다.
- compare: 타워 서버는 바닥에 세워 두고, 랙 서버는 랙에 끼워 넣습니다.
- aliases: ["tower server", "타워형 서버"] · 근거: —

**x86 서버** — fullName: x86(x86-64) 아키텍처 서버 · category: 하드웨어 / 서버
- definition: x86 서버는 인텔(Intel)·AMD의 x86 계열 CPU를 쓰는 서버로, 리눅스나 윈도우 서버를 올려 쓰는 가장 흔한 서버입니다.
- why: 여러 제조사가 만들어 값이 싸고 부품과 소프트웨어 선택 폭이 넓습니다.
- compare: x86 서버는 제조사가 달라도 같은 운영체제를 쓰고, 유닉스 서버는 제조사마다 전용 CPU와 전용 운영체제를 씁니다.
- aliases: ["x86", "x86-64", "x64", "ia서버", "범용 서버", "엑스팔육 서버"] · 근거: —

**유닉스 서버** — fullName: 유닉스(UNIX) 서버 · category: 하드웨어 / 서버
- definition: 유닉스 서버는 IBM Power·HPE Integrity·Oracle SPARC처럼 제조사 전용 CPU에 AIX·HP-UX·Solaris 같은 유닉스 운영체제를 올린 서버입니다.
- why: 한 대의 안정성과 처리 능력이 높아 은행 계정계 같은 핵심 업무 DB에 오래 쓰여 왔습니다.
- compare: 유닉스 서버를 x86 리눅스 서버로 바꾸는 작업을 U2L(Unix to Linux)이라고 부릅니다.
- aliases: ["unix server", "risc 서버", "유닉스", "u2l"] · 근거: —

**메인프레임** — fullName: 메인프레임(Mainframe) · category: 하드웨어 / 서버
- definition: 메인프레임은 아주 많은 거래를 끊김 없이 처리하도록 만든 대형 컴퓨터로, IBM Z 계열이 대표적입니다.
- why: 대량의 거래를 높은 안정성으로 처리해야 하는 은행·보험의 핵심 업무에 쓰입니다.
- compare: 메인프레임은 큰 장비 한 대에 업무를 모으고, 분산 서버(오픈 시스템)는 작은 서버 여러 대에 나눕니다.
- aliases: ["mainframe", "ibm z", "호스트", "메인 프레임"] · 근거: [38]

**CPU 소켓·코어** — fullName: CPU 소켓(Socket)·코어(Core) · category: 하드웨어 / 부품
- definition: 소켓은 서버 메인보드에 꽂는 CPU 칩의 개수이고, 코어는 CPU 칩 하나 안에서 실제로 계산을 하는 단위의 개수입니다.
- why: 서버 처리 능력과 소프트웨어 라이선스 비용이 소켓 수·코어 수로 정해지는 경우가 많습니다.
- compare: "2소켓 32코어"는 CPU 칩 2개에 코어가 모두 합쳐 32개라는 뜻입니다.
- aliases: ["cpu", "core", "socket", "코어", "소켓", "2소켓", "씨피유"] · 근거: —

**vCPU** — fullName: 가상 CPU(Virtual CPU) · category: 하드웨어 / 가상 자원
- definition: vCPU(가상 CPU)는 가상 머신이나 클라우드 서버에 나누어 준 CPU 단위로, 보통 물리 CPU의 스레드 하나에 해당합니다.
- why: 클라우드 서버 사양과 요금을 정하는 기본 단위입니다.
- compare: 물리 코어 하나는 하이퍼스레딩을 켜면 vCPU 2개로 계산되는 경우가 많아, vCPU 수와 물리 코어 수는 같지 않습니다.
- aliases: ["vcpu", "virtual cpu", "가상 CPU", "브이씨피유"] · 근거: [35]

**메모리(RAM)** — fullName: 주기억장치(Random Access Memory) · category: 하드웨어 / 부품
- definition: 메모리(RAM)는 실행 중인 프로그램과 데이터를 잠시 올려 두는 기억장치로, 전원이 꺼지면 내용이 사라집니다.
- why: 메모리가 넉넉해야 프로그램이 느린 디스크를 덜 쓰고 빠르게 동작합니다.
- compare: 메모리는 빠르지만 꺼지면 지워지고, 디스크는 느리지만 꺼져도 남습니다.
- aliases: ["ram", "memory", "메모리", "램", "주기억장치"] · 근거: —

**GPU 서버** — fullName: GPU(Graphics Processing Unit) 서버 · category: 하드웨어 / 서버
- definition: GPU 서버는 그래픽 처리 장치(GPU)를 여러 개 달아 많은 계산을 동시에 처리하는 서버로, AI 학습과 추론에 주로 쓰입니다.
- why: AI 모델 계산은 CPU보다 GPU에서 훨씬 빠르게 끝납니다.
- compare: GPU 서버는 전력과 발열이 일반 서버보다 훨씬 커서 전산실의 전원·냉각 용량을 따로 확인해야 합니다.
- aliases: ["gpu server", "gpu", "지피유 서버", "AI 서버"] · 근거: —

**어플라이언스** — fullName: 어플라이언스(Appliance) · category: 하드웨어 / 일체형 장비
- definition: 어플라이언스는 특정 용도의 소프트웨어를 전용 하드웨어에 미리 설치해 한 덩어리로 파는 일체형 장비입니다.
- why: 설치와 설정을 줄이고 제조사 한 곳에서 장비와 소프트웨어를 함께 지원받습니다.
- compare: 어플라이언스는 장비째로 사고, 소프트웨어 제품은 준비한 서버에 직접 설치합니다.
- aliases: ["appliance", "어플라이언스 장비", "일체형 장비", "엑사데이터"] · 근거: —

**HCI** — fullName: 하이퍼컨버지드 인프라(Hyper-Converged Infrastructure) · category: 하드웨어 / 통합 인프라
- definition: HCI(하이퍼컨버지드 인프라)는 서버·저장소·네트워크 기능을 x86 서버 여러 대에 소프트웨어로 합쳐 한 묶음으로 운영하는 인프라 구성 방식입니다.
- why: 별도 스토리지 장비 없이 서버를 추가하는 것만으로 가상화 환경의 용량을 늘립니다.
- compare: HCI는 서버 안 디스크를 묶어 저장소로 쓰고, 전통 구성은 서버와 SAN 스토리지를 따로 둡니다.
- aliases: ["hci", "hyperconverged", "하이퍼컨버지드", "뉴타닉스", "vsan"] · 근거: —

#### 디스크 · RAID

**HDD** — fullName: 하드 디스크 드라이브(Hard Disk Drive) · category: 하드웨어 / 디스크
- definition: HDD(하드 디스크 드라이브)는 회전하는 자기 원판에 데이터를 기록하는 저장 장치입니다.
- why: 용량당 값이 싸서 백업·보관처럼 큰 용량이 필요한 곳에 씁니다.
- compare: HDD는 싸고 느리며, SSD는 비싸고 빠릅니다.
- aliases: ["hdd", "hard disk", "하드디스크", "하드", "sas 디스크", "sata 디스크"] · 근거: [32]

**SSD** — fullName: 솔리드 스테이트 드라이브(Solid State Drive) · category: 하드웨어 / 디스크
- definition: SSD(솔리드 스테이트 드라이브)는 움직이는 부품 없이 플래시 메모리에 데이터를 기록하는 저장 장치입니다.
- why: 읽고 쓰는 속도가 HDD보다 훨씬 빨라 데이터베이스처럼 디스크를 많이 쓰는 곳의 성능을 높입니다.
- compare: SSD는 저장 장치의 종류이고, NVMe는 SSD를 연결하는 빠른 접속 규격입니다.
- aliases: ["ssd", "solid state drive", "플래시", "올플래시", "에스에스디"] · 근거: [32]

**NVMe** — fullName: Non-Volatile Memory Express · category: 하드웨어 / 디스크 접속 규격
- definition: NVMe(Non-Volatile Memory Express)는 SSD를 PCIe 통로에 직접 연결해 빠르게 읽고 쓰도록 만든 저장 장치 접속 규격입니다.
- why: 예전 디스크용 규격(SATA·SAS)의 속도 한계를 넘어 SSD 성능을 제대로 끌어냅니다.
- compare: 같은 SSD라도 SATA 방식보다 NVMe 방식이 몇 배 빠릅니다.
- aliases: ["nvme", "nvme ssd", "엔브이엠이"] · 근거: [32]

**RAID** — fullName: Redundant Array of Independent Disks · category: 하드웨어 / 디스크 보호
- definition: RAID(Redundant Array of Independent Disks)는 디스크 여러 개를 하나처럼 묶어 속도를 높이거나 디스크가 고장 나도 데이터를 지키는 기술입니다.
- why: 디스크 한두 개가 고장 나도 서비스가 멈추거나 데이터가 사라지지 않게 합니다.
- compare: RAID는 디스크 고장에 대비하는 것이고 백업은 삭제·오류·재해에 대비하는 것이어서, RAID가 백업을 대신하지 못합니다.
- aliases: ["raid", "레이드", "디스크 어레이"] · 근거: [32]

**RAID 0** — fullName: RAID 0 (스트라이핑, Striping) · category: 하드웨어 / 디스크 보호
- definition: RAID 0은 데이터를 여러 디스크에 나누어 기록해 속도와 용량을 얻지만 여분이 없는 RAID 구성입니다.
- why: 잃어도 되는 임시 데이터를 빠르게 읽고 쓸 때 씁니다.
- compare: RAID 0은 디스크 하나만 고장 나도 전체 데이터를 잃고, RAID 1은 하나가 고장 나도 남습니다.
- aliases: ["raid0", "스트라이핑", "striping", "레이드 0"] · 근거: [32]

**RAID 1** — fullName: RAID 1 (미러링, Mirroring) · category: 하드웨어 / 디스크 보호
- definition: RAID 1은 같은 데이터를 디스크 두 개에 똑같이 기록하는 RAID 구성입니다.
- why: 디스크 하나가 고장 나도 나머지 하나로 계속 동작합니다.
- compare: RAID 1은 쓸 수 있는 용량이 절반이고, RAID 5는 디스크 한 개 몫만 빠집니다.
- aliases: ["raid1", "미러링", "mirroring", "레이드 1"] · 근거: [32]

**RAID 5** — fullName: RAID 5 (분산 패리티) · category: 하드웨어 / 디스크 보호
- definition: RAID 5는 디스크 3개 이상에 데이터와 복구용 정보(패리티)를 나누어 기록해 디스크 1개 고장까지 견디는 RAID 구성입니다.
- why: 용량 손실을 디스크 한 개 몫으로 줄이면서 디스크 고장에 대비합니다.
- compare: RAID 5는 디스크 1개 고장까지, RAID 6은 2개 고장까지 견딥니다.
- aliases: ["raid5", "레이드 5", "패리티"] · 근거: [32]

**RAID 6** — fullName: RAID 6 (이중 분산 패리티) · category: 하드웨어 / 디스크 보호
- definition: RAID 6은 디스크 4개 이상에 복구용 정보(패리티)를 이중으로 기록해 디스크 2개가 동시에 고장 나도 견디는 RAID 구성입니다.
- why: 용량이 큰 디스크는 복구 시간이 길어, 복구 중 한 개가 더 고장 나는 경우까지 대비합니다.
- compare: RAID 6은 RAID 5보다 안전하지만 쓰기가 더 느리고 디스크 두 개 몫의 용량이 빠집니다.
- aliases: ["raid6", "레이드 6", "이중 패리티"] · 근거: [32]

**RAID 10** — fullName: RAID 10 (RAID 1+0, 미러링 후 스트라이핑) · category: 하드웨어 / 디스크 보호
- definition: RAID 10은 디스크를 둘씩 미러링(RAID 1)한 묶음들을 다시 나누어 기록(RAID 0)하는 RAID 구성입니다.
- why: 속도와 안전을 함께 얻어야 하는 데이터베이스 저장소에 많이 씁니다.
- compare: RAID 10은 빠르지만 용량의 절반만 쓸 수 있고, RAID 5·6은 용량 효율이 좋지만 쓰기가 느립니다.
- aliases: ["raid10", "raid 1+0", "레이드 10", "레이드 텐"] · 근거: [32]

#### 스토리지 · 연결

**DAS** — fullName: 직접 연결 스토리지(Direct Attached Storage) · category: 하드웨어 / 스토리지
- definition: DAS(Direct Attached Storage)는 서버 한 대에 케이블로 직접 붙여 그 서버만 쓰는 저장 장치입니다.
- why: 구성이 단순하고 값이 싸며 네트워크를 거치지 않아 빠릅니다.
- compare: DAS는 서버 한 대 전용이고, NAS·SAN은 여러 서버가 함께 씁니다.
- aliases: ["das", "direct attached storage", "다스", "직접 연결 스토리지"] · 근거: [32]

**NAS** — fullName: 네트워크 연결 스토리지(Network Attached Storage) · category: 하드웨어 / 스토리지
- definition: NAS(Network Attached Storage)는 일반 네트워크로 연결해 여러 서버가 폴더와 파일 단위로 함께 쓰는 저장 장치입니다.
- why: 여러 서버가 같은 파일(첨부 파일, 이미지 등)을 함께 읽고 써야 할 때 씁니다.
- compare: NAS는 파일 단위로 주고받고(NFS·SMB), SAN은 디스크 블록 단위로 주고받습니다.
- aliases: ["nas", "network attached storage", "나스", "nfs", "공유 스토리지"] · 근거: [32]

**SAN** — fullName: 스토리지 전용 네트워크(Storage Area Network) · category: 하드웨어 / 스토리지
- definition: SAN(Storage Area Network)은 서버와 저장 장치를 전용 고속 네트워크로 연결해 서버가 저장 장치를 자기 디스크처럼 쓰게 하는 구성입니다.
- why: 데이터베이스처럼 빠르고 안정적인 디스크가 필요한 서버 여러 대에 큰 저장 장치를 나누어 줍니다.
- compare: SAN은 서버에 디스크로 보이고, NAS는 서버에 공유 폴더로 보입니다.
- aliases: ["san", "storage area network", "산", "san 스토리지", "san 스위치"] · 근거: [32]

**블록 스토리지** — fullName: 블록 스토리지(Block Storage) · category: 하드웨어 / 스토리지 방식
- definition: 블록 스토리지는 데이터를 일정한 크기의 블록으로 나누어 저장하고 서버에는 디스크 한 개처럼 보이는 저장 방식입니다.
- why: 운영체제와 데이터베이스처럼 디스크를 직접 다루는 프로그램에 빠른 저장소를 줍니다.
- compare: 블록 스토리지는 보통 서버 한 대에 붙여 쓰고, 파일 스토리지는 여러 서버가 함께 씁니다.
- aliases: ["block storage", "볼륨", "volume", "디스크 볼륨"] · 근거: [32][35]

**파일 스토리지** — fullName: 파일 스토리지(File Storage) · category: 하드웨어 / 스토리지 방식
- definition: 파일 스토리지는 데이터를 폴더와 파일 구조로 저장하고 NFS·SMB 같은 규약으로 여러 서버가 함께 쓰는 저장 방식입니다.
- why: 여러 서버가 같은 파일을 보통의 폴더처럼 읽고 쓰게 합니다.
- compare: 파일 스토리지는 폴더 경로로 찾고, 오브젝트 스토리지는 고유한 키(주소)로 찾습니다.
- aliases: ["file storage", "공유 파일 시스템", "nfs", "smb", "cifs"] · 근거: [32][35]

**오브젝트 스토리지** — fullName: 오브젝트 스토리지(Object Storage) · category: 하드웨어 / 스토리지 방식
- definition: 오브젝트 스토리지는 파일을 설명 정보와 함께 객체 단위로 저장하고 HTTP API로 넣고 꺼내는 저장 방식입니다.
- why: 이미지·동영상·백업처럼 양이 아주 많은 파일을 싸게 거의 한없이 저장합니다.
- compare: 오브젝트 스토리지는 디스크처럼 서버에 붙이지 않고 API로 접근하며, 파일 일부만 고쳐 쓰기는 어렵습니다.
- aliases: ["object storage", "객체 스토리지", "오브젝트 저장소", "버킷"] · 근거: [32][35]

**파이버 채널** — fullName: 파이버 채널(Fibre Channel, FC) · category: 하드웨어 / 스토리지 연결
- definition: 파이버 채널(Fibre Channel)은 서버와 저장 장치를 연결하는 SAN 전용 고속 통신 규격으로, 주로 광케이블을 씁니다.
- why: 일반 네트워크와 분리된 전용 통로로 저장 장치를 빠르고 안정적으로 연결합니다.
- compare: 파이버 채널은 전용 장비(HBA·SAN 스위치)가 필요하고, iSCSI는 일반 이더넷 장비를 그대로 씁니다.
- aliases: ["fc", "fibre channel", "fiber channel", "광채널", "파이버채널"] · 근거: [32]

**iSCSI** — fullName: Internet Small Computer Systems Interface · category: 하드웨어 / 스토리지 연결
- definition: iSCSI는 일반 IP 네트워크(이더넷) 위로 저장 장치 명령을 주고받아 서버가 먼 저장 장치를 자기 디스크처럼 쓰게 하는 통신 규격입니다.
- why: 전용 SAN 장비 없이 기존 네트워크 장비로 SAN을 값싸게 구성합니다.
- compare: iSCSI는 싸고 구성이 쉽지만, 파이버 채널보다 일반 네트워크 상태의 영향을 더 받습니다.
- aliases: ["iscsi", "아이스카시", "ip san"] · 근거: [32][33]

**HBA** — fullName: 호스트 버스 어댑터(Host Bus Adapter) · category: 하드웨어 / 부품
- definition: HBA(Host Bus Adapter)는 서버를 SAN 스토리지나 외부 저장 장치에 연결하기 위해 서버에 꽂는 확장 카드입니다.
- why: 서버가 파이버 채널 같은 저장 장치 전용 통로에 붙을 수 있게 합니다.
- compare: HBA는 저장 장치용 연결 카드이고, NIC는 일반 네트워크용 연결 카드입니다.
- aliases: ["hba", "host bus adapter", "fc hba", "에이치비에이"] · 근거: [32]

**NIC** — fullName: 네트워크 인터페이스 카드(Network Interface Card) · category: 하드웨어 / 부품
- definition: NIC(Network Interface Card)는 서버를 네트워크에 연결하는 부품으로, 랜 케이블이나 광케이블을 꽂는 포트를 제공합니다.
- why: 서버가 다른 장비와 통신하려면 반드시 있어야 하고, 포트 속도(1G·10G·25G)가 통신 속도를 정합니다.
- compare: NIC는 일반 네트워크에 연결하고, HBA는 저장 장치 전용 통로에 연결합니다.
- aliases: ["nic", "network interface card", "랜카드", "네트워크 카드", "닉"] · 근거: —

**본딩·티밍** — fullName: NIC 본딩(Bonding)·티밍(Teaming), 링크 묶음(Link Aggregation) · category: 하드웨어 / 네트워크 이중화
- definition: 본딩·티밍은 서버의 네트워크 포트 여러 개를 하나처럼 묶어 한 포트나 케이블이 고장 나도 통신이 이어지게 하는 구성입니다.
- why: 랜 케이블이나 스위치 한 대가 고장 나도 서버 통신이 끊기지 않게 합니다.
- compare: 리눅스에서는 본딩, 윈도우에서는 티밍이라고 부르며 뜻은 같습니다.
- aliases: ["bonding", "teaming", "nic teaming", "lacp", "본딩", "티밍", "링크 애그리게이션"] · 근거: [42]

#### 백업 장비

**테이프 라이브러리(PTL)** — fullName: 물리 테이프 라이브러리(Physical Tape Library) · category: 하드웨어 / 백업 장비
- definition: 테이프 라이브러리(PTL)는 자기 테이프 여러 개와 테이프 드라이브, 테이프를 옮기는 로봇 팔을 한 장비에 담아 백업을 자동으로 기록하는 장치입니다.
- why: 많은 양의 백업을 값싸게 오래 보관하고, 테이프를 꺼내 다른 곳에 따로 보관할 수 있습니다.
- compare: 테이프는 싸고 오래 보관하기 좋지만 복구가 느리고, 디스크 백업은 비싸지만 복구가 빠릅니다.
- aliases: ["ptl", "tape library", "lto", "테이프 백업", "테이프 장비"] · 근거: [32]

**VTL** — fullName: 가상 테이프 라이브러리(Virtual Tape Library) · category: 하드웨어 / 백업 장비
- definition: VTL(Virtual Tape Library)은 디스크 저장 장치를 백업 소프트웨어에는 테이프 라이브러리처럼 보이게 만든 백업 장비입니다.
- why: 테이프용으로 짜 둔 백업 절차를 그대로 쓰면서 디스크의 빠른 백업·복구 속도를 얻습니다.
- compare: VTL은 실제로는 디스크에 저장하고, PTL은 실제 테이프에 저장합니다.
- aliases: ["vtl", "virtual tape library", "가상 테이프", "브이티엘"] · 근거: [32]

#### 스위치 (장비 관점)

**L2 스위치** — fullName: 2계층(Layer 2) 스위치 · category: 하드웨어 / 네트워크 장비
- definition: L2 스위치는 같은 네트워크 안의 서버와 장비를 랜 케이블로 연결하고 장비 고유 주소(MAC 주소)를 보고 데이터를 전달하는 네트워크 장비입니다.
- why: 랙 안의 서버 여러 대를 네트워크에 연결하는 기본 장비입니다.
- compare: L2 스위치는 같은 네트워크 안에서만 전달하고, L3 스위치는 다른 네트워크로도 길을 찾아 전달합니다.
- aliases: ["l2", "layer 2 switch", "스위치", "스위칭 허브", "tor 스위치", "엘투 스위치"] · 근거: —

**L3 스위치** — fullName: 3계층(Layer 3) 스위치 · category: 하드웨어 / 네트워크 장비
- definition: L3 스위치는 IP 주소를 보고 서로 다른 네트워크 사이로 데이터의 길을 찾아 전달하는(라우팅) 기능을 가진 스위치입니다.
- why: 여러 네트워크 구역(서브넷·VLAN)을 서로 연결하는 전산실의 중심 장비로 씁니다.
- compare: L3 스위치는 IP 주소까지 보고, L4 스위치는 포트 번호까지 보고 서버로 나누어 보냅니다.
- aliases: ["l3", "layer 3 switch", "백본 스위치", "코어 스위치", "엘쓰리 스위치"] · 근거: —

**L4·L7 스위치(장비)** — fullName: 4계층·7계층 스위치(부하 분산 장비, ADC) · category: 하드웨어 / 네트워크 장비
- definition: L4·L7 스위치는 들어온 요청을 여러 서버에 나누어 보내는 부하 분산 기능을 전용 하드웨어로 만든 장비로, ADC(Application Delivery Controller)라고도 부릅니다.
- why: 많은 요청을 전용 장비로 빠르게 나누고 고장 난 서버를 자동으로 빼냅니다.
- compare: 구성도에서 "L4"는 대개 이 장비를 가리키며, 클라우드에서는 장비 대신 로드밸런서 서비스(ALB·NLB)를 씁니다.
- aliases: ["l4 스위치", "l7 스위치", "adc", "slb", "엘포 스위치", "부하 분산 장비"] · 근거: — (기능 설명은 기존 항목 "L4 로드밸런서", "L7 로드밸런서" 참고)

#### 전산실 설비

**랙** — fullName: 서버 랙(Rack, 19인치 캐비닛) · category: 하드웨어 / 전산실 설비
- definition: 랙은 서버·스위치·스토리지 같은 장비를 층층이 끼워 넣는 폭 19인치 규격의 철제 선반(캐비닛)입니다.
- why: 장비를 좁은 바닥 면적에 높이 쌓고 전원과 케이블을 정리합니다.
- compare: 랙 하나의 높이는 보통 42U이고, 장비 높이를 U 단위로 세어 몇 대가 들어갈지 계산합니다.
- aliases: ["rack", "서버 랙", "캐비닛", "19인치 랙", "42U 랙"] · 근거: [41]

**U(랙 유닛)** — fullName: 랙 유닛(Rack Unit) · category: 하드웨어 / 전산실 설비
- definition: U(랙 유닛)는 랙에 넣는 장비의 높이를 세는 단위로, 1U는 1.75인치(약 44.45mm)입니다.
- why: 장비가 랙에서 차지하는 자리를 세어 랙과 상면이 얼마나 필요한지 계산합니다.
- compare: "2U 서버"는 높이가 2칸인 서버라는 뜻으로, 성능이 아니라 크기를 말합니다.
- aliases: ["rack unit", "ru", "1u", "2u", "유", "랙 유닛"] · 근거: [41]

**상면** — fullName: 상면(床面, 전산실 바닥 면적) · category: 하드웨어 / 전산실 설비
- definition: 상면은 전산실에서 장비를 놓는 바닥 공간을 뜻하는 말로, 보통 랙 몇 개를 놓을 자리인지로 셉니다.
- why: IDC 임대 비용과 장비 증설 가능 여부가 상면으로 정해집니다.
- compare: "상면이 부족하다"는 말은 디스크 용량이 아니라 장비를 놓을 자리가 없다는 뜻입니다.
- aliases: ["상면 공간", "랙 상면", "floor space", "상면 임대"] · 근거: —

**UPS** — fullName: 무정전 전원 장치(Uninterruptible Power Supply) · category: 하드웨어 / 전산실 설비
- definition: UPS(무정전 전원 장치)는 정전이나 전압 이상이 생겼을 때 배터리로 장비에 전기를 잠시 계속 공급하는 장치입니다.
- why: 정전 순간에 서버가 갑자기 꺼져 데이터가 깨지는 것을 막고 비상 발전기가 돌 때까지 시간을 법니다.
- compare: UPS는 몇 분에서 몇십 분만 버티고, 긴 정전은 비상 발전기가 맡습니다.
- aliases: ["ups", "무정전 전원", "무정전 전원 공급 장치", "유피에스"] · 근거: —

**항온항습기** — fullName: 항온항습기(전산실 공조 장치, CRAC) · category: 하드웨어 / 전산실 설비
- definition: 항온항습기는 전산실의 온도와 습도를 일정하게 유지하는 냉방·공조 장치입니다.
- why: 서버가 내는 열을 식히고 습도를 맞춰 장비 고장을 막습니다.
- compare: 일반 에어컨과 달리 1년 내내 쉬지 않고 돌도록 만들어졌고 습도까지 조절합니다.
- aliases: ["항온항습", "crac", "공조", "전산실 냉방"] · 근거: —

**KVM 스위치** — fullName: KVM(Keyboard, Video, Mouse) 스위치 · category: 하드웨어 / 전산실 설비
- definition: KVM 스위치는 키보드·모니터·마우스 한 벌로 서버 여러 대를 골라 가며 조작하게 해 주는 전환 장치입니다.
- why: 서버마다 모니터와 키보드를 달지 않고도 전산실에서 여러 서버를 직접 조작합니다.
- compare: KVM 스위치는 조작용 장치이고, 리눅스 가상화 기능인 KVM(Kernel-based Virtual Machine)과는 이름만 같습니다.
- aliases: ["kvm switch", "kvm over ip", "케이브이엠 스위치"] · 근거: —

### 2-C. 현업 개념 (why·compare 채움)

#### 노드 종류 설명용 (기존 50개에 없는 것)

**웹 클라이언트** — fullName: 웹 클라이언트(Web Client, 웹 브라우저) · category: 사용자 / 접속 단말
- definition: 웹 클라이언트는 사용자가 PC나 휴대폰의 웹 브라우저로 서비스에 접속하는 쪽을 가리키는 말입니다.
- why: 구성도에서 요청이 어디서 시작되는지를 보여 줍니다.
- compare: 웹 클라이언트는 브라우저로 접속하고, 모바일 클라이언트는 설치한 앱으로 접속합니다.
- aliases: ["web client", "browser", "브라우저", "사용자 PC", "웹 사용자"] · 근거: —

**모바일 클라이언트** — fullName: 모바일 클라이언트(Mobile Client, 모바일 앱) · category: 사용자 / 접속 단말
- definition: 모바일 클라이언트는 사용자가 휴대폰이나 태블릿에 설치한 앱으로 서비스에 접속하는 쪽을 가리키는 말입니다.
- why: 앱은 브라우저와 달리 푸시 알림·앱 배포·버전 관리가 따로 필요해 구성도에서 구분합니다.
- compare: 모바일 클라이언트는 보통 화면이 아니라 API를 호출하고, 웹 클라이언트는 화면(HTML)도 함께 받습니다.
- aliases: ["mobile client", "mobile app", "모바일 앱", "앱", "ios", "android"] · 근거: —

**관리자** — fullName: 관리자(Administrator, 운영자) · category: 사용자 / 접속 주체
- definition: 관리자는 서비스나 서버를 설정·운영하기 위해 일반 사용자와 다른 경로와 권한으로 접속하는 내부 사람을 가리킵니다.
- why: 관리자 접속 경로는 일반 사용자 경로와 분리해 더 엄격하게 통제해야 하므로 구성도에 따로 그립니다.
- compare: 일반 사용자는 인터넷으로 서비스 화면에 들어오고, 관리자는 VPN·배스천 등을 거쳐 관리 화면이나 서버에 들어옵니다.
- aliases: ["admin", "administrator", "운영자", "어드민", "관리자 단말"] · 근거: —

**웹 서버** — fullName: 웹 서버(Web Server) · category: 서버 / 웹 계층
- definition: 웹 서버는 브라우저의 HTTP 요청을 받아 이미지·HTML 같은 정해진 파일을 돌려주고, 프로그램 실행이 필요한 요청은 뒤쪽 WAS로 넘기는 서버입니다.
- why: 단순한 파일 전달과 접속 처리를 앞에서 맡아 WAS의 부담을 덜고 WAS를 외부에 직접 드러내지 않습니다.
- compare: 웹 서버는 이미 만들어진 파일을 전달하고, WAS는 프로그램을 실행해 결과를 만들어 냅니다.
- aliases: ["web server", "웹서버", "web", "http 서버"] · 근거: —

**앱 서버** — fullName: 애플리케이션 서버(Application Server) · category: 서버 / 애플리케이션 계층
- definition: 앱 서버는 업무 로직을 담은 프로그램을 실행해 요청을 처리하는 서버를 통틀어 부르는 말입니다.
- why: 화면 전달(웹 서버)과 데이터 저장(DB) 사이에서 실제 업무 처리를 맡습니다.
- compare: WAS는 웹 요청을 처리하는 앱 서버의 한 종류이고, 앱 서버는 API 서버·내부 업무 서버까지 포함하는 넓은 말입니다.
- aliases: ["app server", "application server", "ap 서버", "ap", "애플리케이션 서버", "api 서버"] · 근거: —

**배치 서버** — fullName: 배치 서버(Batch Server) · category: 서버 / 배치
- definition: 배치 서버는 사용자의 요청을 기다리지 않고 정해진 시각에 대량의 데이터를 한꺼번에 처리하는 프로그램을 실행하는 서버입니다.
- why: 정산·통계·데이터 이관처럼 오래 걸리는 작업을 온라인 서비스와 분리해 서비스가 느려지지 않게 합니다.
- compare: 배치 서버는 정해진 시간에 몰아서 처리하고, WAS는 요청이 올 때마다 바로 처리합니다.
- aliases: ["batch server", "배치서버", "배치 ap", "스케줄러 서버"] · 근거: —

**관리형 서비스** — fullName: 관리형 서비스(Managed Service) · category: 클라우드 / 서비스 형태
- definition: 관리형 서비스는 데이터베이스·캐시·큐 같은 소프트웨어의 설치·패치·백업·장애 복구를 클라우드 사업자가 대신 해 주는 서비스 형태입니다.
- why: 운영 인력과 시간을 줄이고 장애 복구를 사업자가 검증한 방식에 맡깁니다.
- compare: 관리형 서비스는 사업자가 운영하고, 가상 서버에 직접 설치하면 사용자가 운영합니다.
- aliases: ["managed service", "매니지드 서비스", "완전 관리형", "fully managed"] · 근거: [31][35]

**관계형 DB** — fullName: 관계형 데이터베이스(Relational Database, RDBMS) · category: 데이터 / 데이터베이스
- definition: 관계형 DB는 데이터를 행과 열로 된 표에 저장하고 표들을 서로 연결해 SQL로 조회하는 데이터베이스입니다.
- why: 주문·결제·회원처럼 정확해야 하고 서로 얽힌 데이터를 어긋남 없이 저장합니다.
- compare: 관계형 DB는 정해진 표 구조와 트랜잭션을 지키고, NoSQL DB는 구조가 자유롭고 서버를 늘려 확장하기 쉽습니다.
- aliases: ["rdb", "rdbms", "relational database", "관계형 데이터베이스", "sql db", "알디비"] · 근거: —

**NoSQL DB** — fullName: NoSQL(Not Only SQL) 데이터베이스 · category: 데이터 / 데이터베이스
- definition: NoSQL DB는 표 구조 대신 키-값·문서·와이드 컬럼·그래프 같은 형태로 데이터를 저장하는 데이터베이스를 통틀어 부르는 말입니다.
- why: 구조가 자주 바뀌거나 양이 아주 많은 데이터를 여러 서버에 나누어 빠르게 저장합니다.
- compare: NoSQL DB는 확장과 속도에 강하고, 관계형 DB는 여러 표를 묶는 조회와 엄격한 트랜잭션에 강합니다.
- aliases: ["nosql", "no-sql", "노에스큐엘", "비관계형 DB", "문서 DB", "키-값 저장소"] · 근거: —

**검색 엔진** — fullName: 검색 엔진(Search Engine) · category: 데이터 / 검색
- definition: 검색 엔진은 글과 문서를 단어 단위로 미리 색인해 두고 검색어에 맞는 결과를 관련도 순으로 빠르게 찾아 주는 시스템입니다.
- why: 데이터베이스로는 느리거나 어려운 본문 검색, 오타 보정, 자동 완성을 처리합니다.
- compare: 검색 엔진은 찾기 전용 사본이고, 원본 데이터는 데이터베이스에 둡니다.
- aliases: ["search engine", "검색엔진", "전문 검색", "full-text search", "색인"] · 근거: —

**큐** — fullName: 메시지 큐(Message Queue) · category: 미들웨어 / 메시징
- definition: 큐(메시지 큐)는 보내는 시스템이 맡긴 메시지를 받는 시스템이 꺼내 갈 때까지 순서대로 쌓아 두는 중간 저장소입니다.
- why: 받는 쪽이 느리거나 잠시 멈춰도 요청을 잃지 않고 나중에 처리하게 합니다.
- compare: 큐의 메시지는 한 번 꺼내 처리하면 사라지고, 스트림의 기록은 남아서 여러 곳이 다시 읽을 수 있습니다.
- aliases: ["queue", "message queue", "mq", "메시지 큐", "메시지 브로커"] · 근거: —

**스트림** — fullName: 이벤트 스트림(Event Stream) · category: 미들웨어 / 메시징
- definition: 스트림은 계속 발생하는 사건(이벤트) 기록을 시간 순서대로 쌓아 두고 여러 시스템이 각자 읽어 가게 하는 저장·전달 방식입니다.
- why: 같은 데이터를 여러 시스템이 실시간으로 받아 각자 다른 용도로 처리하게 합니다.
- compare: 스트림은 기록을 일정 기간 남겨 다시 읽을 수 있고, 큐는 꺼내 가면 없어집니다.
- aliases: ["stream", "event stream", "스트리밍", "이벤트 스트림", "로그 스트림"] · 근거: —

**외부 API** — fullName: 외부 API(External API, 외부 연동 서비스) · category: 외부 연동
- definition: 외부 API는 우리 시스템이 인터넷이나 전용선으로 호출해 기능이나 데이터를 받아 오는 다른 회사·기관의 서비스입니다.
- why: 지도·문자 발송·본인 확인처럼 직접 만들기 어려운 기능을 가져다 씁니다.
- compare: 외부 API는 우리가 운영하지 않아 장애와 응답 지연을 우리가 고칠 수 없으므로, 호출 실패에 대비한 처리를 따로 둡니다.
- aliases: ["external api", "3rd party api", "서드파티 API", "오픈 API", "외부 연동"] · 근거: —

**외부 인증** — fullName: 외부 인증 서비스(External Identity Provider, IdP) · category: 외부 연동 / 인증
- definition: 외부 인증은 로그인한 사람이 누구인지 확인하는 일을 우리 시스템이 아니라 다른 회사·기관의 인증 서비스에 맡기는 것입니다.
- why: 비밀번호를 직접 보관하지 않고 소셜 로그인·본인 확인·사내 통합 계정을 그대로 씁니다.
- compare: 외부 인증은 "누구인지 확인해 주는 곳"이고, OAuth는 그 확인 결과를 주고받는 규약입니다.
- aliases: ["idp", "identity provider", "소셜 로그인", "본인 인증", "간편 인증", "인증 서비스"] · 근거: —

**쿠버네티스 클러스터** — fullName: 쿠버네티스 클러스터(Kubernetes Cluster) · category: 컨테이너 / 쿠버네티스
- definition: 쿠버네티스 클러스터는 전체를 관리하는 컨트롤 플레인과 컨테이너를 실제로 실행하는 워커 노드 여러 대를 묶은 쿠버네티스 한 벌입니다.
- why: 서버 여러 대를 하나의 큰 실행 공간처럼 다루어 컨테이너를 알아서 배치하고 되살립니다.
- compare: 쿠버네티스는 소프트웨어 이름이고, 쿠버네티스 클러스터는 그것으로 실제 구성한 서버 묶음입니다.
- aliases: ["k8s cluster", "kubernetes cluster", "클러스터(K8s)", "워커 노드", "컨트롤 플레인"] · 근거: [39]

**가상 머신(VM)** — fullName: 가상 머신(Virtual Machine) · category: 가상화
- definition: 가상 머신(VM)은 물리 서버 한 대의 자원을 소프트웨어로 나누어 만든, 운영체제를 따로 갖는 가상의 서버입니다.
- why: 서버 한 대에 여러 업무를 서로 섞이지 않게 올려 장비를 아끼고, 서버를 몇 분 만에 새로 만듭니다.
- compare: 가상 머신은 운영체제까지 통째로 갖고, 컨테이너는 운영체제를 함께 쓰고 프로그램만 따로 담아 더 가볍습니다.
- aliases: ["vm", "virtual machine", "가상 서버", "가상머신", "게스트 OS", "인스턴스"] · 근거: —

**하이퍼바이저** — fullName: 하이퍼바이저(Hypervisor) · category: 가상화
- definition: 하이퍼바이저는 물리 서버의 CPU·메모리·디스크를 나누어 가상 머신 여러 개를 만들고 실행하는 소프트웨어입니다.
- why: 가상 머신들이 한 서버의 자원을 서로 방해하지 않고 나누어 쓰게 합니다.
- compare: 하이퍼바이저는 가상 머신을 띄우는 바탕이고, 가상 머신은 그 위에서 도는 가상의 서버입니다.
- aliases: ["hypervisor", "가상화 소프트웨어", "vmm", "esxi", "kvm"] · 근거: —

#### 이중화 · 가용성

**이중화** — fullName: 이중화(Redundancy) · category: 가용성
- definition: 이중화는 서버·장비·회선을 같은 것으로 둘 이상 두어 하나가 고장 나도 나머지로 서비스를 이어 가게 하는 구성입니다.
- why: 장비 한 대의 고장이 서비스 중단으로 이어지지 않게 합니다.
- compare: 이중화는 고장에 대비해 여분을 두는 것이고, 백업은 데이터가 지워지거나 깨졌을 때 되돌리기 위한 사본입니다.
- aliases: ["redundancy", "다중화", "이중화 구성", "spof 제거", "리던던시"] · 근거: —

**Active-Active** — fullName: 액티브-액티브(Active-Active) 구성 · category: 가용성
- definition: Active-Active는 이중화한 장비 두 대 이상이 모두 동시에 요청을 처리하는 구성입니다.
- why: 평소에는 처리 능력을 함께 쓰고, 한 대가 고장 나면 남은 장비가 이어서 처리합니다.
- compare: Active-Active는 모두 일하고, Active-Standby는 한 대만 일하고 나머지는 대기합니다.
- aliases: ["active/active", "aa", "액티브 액티브", "액티브-액티브", "양방향 이중화"] · 근거: —

**HA** — fullName: 고가용성(High Availability) · category: 가용성
- definition: HA(고가용성)는 장애가 나도 서비스가 멈추는 시간을 아주 짧게 유지하는 성질, 또는 그렇게 만든 구성을 뜻합니다.
- why: 장애로 서비스가 멈추는 시간을 줄여 업무 손실을 막습니다.
- compare: HA는 같은 전산실 안의 장비 고장에 대비하고, DR은 전산실 전체가 못 쓰게 되는 재해에 대비합니다.
- aliases: ["high availability", "고가용성", "ha 구성", "에이치에이"] · 근거: —

**클러스터링** — fullName: 클러스터링(Clustering) · category: 가용성 / 확장
- definition: 클러스터링은 서버 여러 대를 묶어 바깥에서는 하나의 시스템처럼 보이고 동작하게 하는 구성입니다.
- why: 한 대가 고장 나도 서비스가 이어지고, 여러 대가 일을 나누어 처리 능력을 높입니다.
- compare: 로드밸런싱은 요청을 나누는 것까지이고, 클러스터링은 서버들이 서로 상태를 알고 함께 움직입니다.
- aliases: ["clustering", "cluster", "클러스터", "클러스터 구성"] · 근거: —

**페일오버** — fullName: 페일오버(Failover, 장애 조치) · category: 가용성
- definition: 페일오버는 일하던 장비에 장애가 났을 때 대기하던 장비가 그 일을 자동 또는 수동으로 넘겨받는 것입니다.
- why: 장애가 나도 사람이 복구할 때까지 기다리지 않고 서비스를 이어 갑니다.
- compare: 페일오버는 장애 때 대기 쪽으로 넘어가는 것이고, 페일백은 복구 뒤 원래 쪽으로 되돌아오는 것입니다.
- aliases: ["failover", "fail-over", "장애 조치", "절체", "테이크오버", "takeover"] · 근거: —

**페일백** — fullName: 페일백(Failback, 원복) · category: 가용성
- definition: 페일백은 페일오버로 넘어갔던 서비스를 원래 장비가 복구된 뒤 원래 장비로 되돌리는 것입니다.
- why: 임시로 버티던 상태를 끝내고 원래의 이중화 구성으로 돌아갑니다.
- compare: 페일오버는 급하게 일어나지만, 페일백은 보통 사용자가 적은 시간에 계획해서 합니다.
- aliases: ["failback", "fail-back", "원복", "절체 복귀"] · 근거: —

**세션 클러스터링** — fullName: 세션 클러스터링(Session Clustering) · category: 가용성 / WAS
- definition: 세션 클러스터링은 WAS 여러 대가 로그인 상태 같은 세션 정보를 서로 복제하거나 한곳에 함께 저장해 공유하는 구성입니다.
- why: WAS 한 대가 죽어도 사용자가 다시 로그인하지 않고 다른 WAS에서 이어서 쓰게 합니다.
- compare: 세션 클러스터링은 세션을 여러 대가 공유하고, 스티키 세션은 사용자를 한 대에만 계속 보내 공유 없이 해결합니다.
- aliases: ["session clustering", "세션 공유", "세션 복제", "session replication"] · 근거: —

**스티키 세션** — fullName: 스티키 세션(Sticky Session, 세션 고정) · category: 부하 분산
- definition: 스티키 세션은 로드밸런서가 같은 사용자의 요청을 처음 연결된 서버 한 대로만 계속 보내는 설정입니다.
- why: 세션을 서버끼리 공유하지 않아도 로그인 상태가 유지되게 합니다.
- compare: 스티키 세션은 그 서버가 죽으면 세션을 잃고, 세션 클러스터링은 다른 서버가 이어받습니다.
- aliases: ["sticky session", "session affinity", "세션 고정", "세션 어피니티", "퍼시스턴스", "persistence"] · 근거: —

**헬스 체크** — fullName: 헬스 체크(Health Check, 상태 확인) · category: 부하 분산 / 가용성
- definition: 헬스 체크는 로드밸런서나 관리 시스템이 서버에 주기적으로 신호를 보내 정상인지 확인하는 동작입니다.
- why: 고장 난 서버를 자동으로 찾아 요청을 보내지 않게 합니다.
- compare: 헬스 체크는 "살아 있나"만 짧게 묻고, 모니터링은 성능과 상태를 자세히 모아 기록합니다.
- aliases: ["health check", "헬스체크", "상태 검사", "liveness", "readiness", "l4 체크"] · 근거: —

**라운드 로빈** — fullName: 라운드 로빈(Round Robin, RR) · category: 부하 분산 방식
- definition: 라운드 로빈은 들어온 요청을 서버들에 차례대로 한 번씩 돌아가며 나누어 주는 부하 분산 방식입니다.
- why: 가장 단순하고, 서버 성능이 비슷할 때 요청을 고르게 나눕니다.
- compare: 라운드 로빈은 서버가 지금 얼마나 바쁜지 보지 않고, 최소 연결 방식은 덜 바쁜 서버를 골라 보냅니다.
- aliases: ["round robin", "rr", "라운드로빈", "순차 분배"] · 근거: —

**최소 연결** — fullName: 최소 연결(Least Connections, LC) · category: 부하 분산 방식
- definition: 최소 연결은 지금 처리 중인 연결 수가 가장 적은 서버로 새 요청을 보내는 부하 분산 방식입니다.
- why: 요청마다 처리 시간이 크게 다를 때 특정 서버에만 일이 쌓이는 것을 막습니다.
- compare: 최소 연결은 서버의 현재 연결 수를 보고, 라운드 로빈은 순서만 봅니다.
- aliases: ["least connection", "least connections", "lc", "리스트 커넥션", "최소 접속"] · 근거: —

**해시 분산** — fullName: 해시(Hash) 기반 부하 분산 · category: 부하 분산 방식
- definition: 해시 분산은 접속한 쪽의 IP 주소 같은 값을 계산한 결과로 서버를 정해, 같은 값이면 늘 같은 서버로 보내는 부하 분산 방식입니다.
- why: 같은 사용자를 계속 같은 서버로 보내 세션이나 캐시를 그대로 쓰게 합니다.
- compare: 해시 분산은 값으로 서버가 정해져 고르게 나뉘지 않을 수 있고, 라운드 로빈은 고르게 나누지만 같은 서버로 간다는 보장이 없습니다.
- aliases: ["hash", "source ip hash", "ip hash", "해시", "소스 IP 해시"] · 근거: —

**가용성** — fullName: 가용성(Availability) · category: 가용성 / 지표
- definition: 가용성은 전체 시간 가운데 서비스가 정상으로 쓸 수 있었던 시간의 비율로, 보통 퍼센트로 나타냅니다.
- why: 서비스가 얼마나 멈추지 않아야 하는지를 숫자로 정해 설계와 계약의 기준으로 삼습니다.
- compare: 99.9%는 1년에 약 8시간 46분, 99.99%는 약 53분까지 멈춰도 된다는 뜻입니다.
- aliases: ["availability", "가동률", "업타임", "uptime", "쓰리 나인", "포 나인", "99.9%"] · 근거: — (연 365일 기준 계산값)

**SLA** — fullName: 서비스 수준 협약(Service Level Agreement) · category: 운영 / 계약
- definition: SLA(서비스 수준 협약)는 서비스를 제공하는 쪽과 쓰는 쪽이 가용성·응답 시간·장애 복구 시간 같은 수준을 숫자로 정해 약속한 문서입니다.
- why: 서비스 품질을 측정할 기준과 지키지 못했을 때의 보상을 미리 정합니다.
- compare: SLA는 계약상의 약속이고, 가용성은 그 안에 들어가는 지표 가운데 하나입니다.
- aliases: ["service level agreement", "서비스 수준 협약", "서비스 수준 계약", "에스엘에이"] · 근거: —

#### 재해복구 · 백업

**DR** — fullName: 재해복구(Disaster Recovery) · category: 재해복구
- definition: DR(재해복구)은 화재·지진·정전 같은 재해로 주 전산센터를 못 쓰게 됐을 때 떨어진 곳의 다른 센터에서 서비스를 다시 살리는 체계입니다.
- why: 전산센터 한 곳 전체가 멈춰도 업무를 이어 가게 합니다.
- compare: DR은 센터 전체의 재해에 대비하고, HA는 센터 안의 장비 고장에 대비합니다.
- aliases: ["disaster recovery", "재해복구", "재해 복구", "dr 센터", "drc", "재해복구센터", "디알"] · 근거: [23]

**미러 사이트** — fullName: 미러 사이트(Mirrored Site) · category: 재해복구 / DR 센터 유형
- definition: 미러 사이트는 주 센터와 같은 장비를 갖추고 데이터를 실시간으로 똑같이 맞춰 두어 두 곳이 함께 서비스할 수 있는 재해복구 센터입니다.
- why: 재해가 나도 서비스가 거의 끊기지 않게 합니다.
- compare: 미러 사이트는 평소에도 함께 가동하고, 핫 사이트는 준비만 해 두고 재해 때 넘겨받습니다.
- aliases: ["mirror site", "mirrored site", "미러 센터", "미러링 센터", "active-active dr"] · 근거: [23]

**핫 사이트** — fullName: 핫 사이트(Hot Site) · category: 재해복구 / DR 센터 유형
- definition: 핫 사이트는 주 센터와 같은 수준의 장비를 켜 두고 데이터를 거의 실시간으로 받아 두어 재해 때 짧은 시간 안에 넘겨받는 재해복구 센터입니다.
- why: 재해 뒤 몇 시간 안에 서비스를 다시 열어야 하는 중요한 업무에 씁니다.
- compare: 핫 사이트는 장비가 켜져 대기하고, 웜 사이트는 일부 장비만 갖추고 데이터도 덜 최신입니다.
- aliases: ["hot site", "핫 센터", "핫사이트"] · 근거: [23]

**웜 사이트** — fullName: 웜 사이트(Warm Site) · category: 재해복구 / DR 센터 유형
- definition: 웜 사이트는 중요한 장비 일부만 갖추고 데이터를 주기적으로 받아 두어 재해 때 며칠 안에 서비스를 살리는 재해복구 센터입니다.
- why: 핫 사이트보다 비용을 줄이면서 중요한 업무부터 복구할 수 있게 합니다.
- compare: 웜 사이트는 일부 장비가 준비돼 있고, 콜드 사이트는 장소와 전기·통신만 있습니다.
- aliases: ["warm site", "웜 센터", "웜사이트"] · 근거: [23]

**콜드 사이트** — fullName: 콜드 사이트(Cold Site) · category: 재해복구 / DR 센터 유형
- definition: 콜드 사이트는 장소와 전원·냉방·통신 회선만 마련해 두고 재해가 난 뒤에 장비를 들여와 복구하는 재해복구 센터입니다.
- why: 유지 비용이 가장 적게 들어, 오래 멈춰도 되는 업무에 씁니다.
- compare: 콜드 사이트는 비용이 가장 싸지만 복구에 몇 주가 걸릴 수 있고, 미러 사이트는 가장 비싸지만 거의 바로 이어집니다.
- aliases: ["cold site", "콜드 센터", "콜드사이트"] · 근거: [23]

**RTO** — fullName: 목표 복구 시간(Recovery Time Objective) · category: 재해복구 / 지표
- definition: RTO(목표 복구 시간)는 장애나 재해가 난 뒤 서비스를 다시 쓸 수 있게 되기까지 허용하는 최대 시간입니다.
- why: 업무가 얼마나 오래 멈춰도 되는지를 정해 이중화와 재해복구 수준(비용)을 결정합니다.
- compare: RTO는 "얼마나 빨리 되살리나"이고, RPO는 "데이터를 어느 시점까지 되살리나"입니다.
- aliases: ["recovery time objective", "목표 복구 시간", "복구 목표 시간", "알티오"] · 근거: [23]

**RPO** — fullName: 목표 복구 시점(Recovery Point Objective) · category: 재해복구 / 지표
- definition: RPO(목표 복구 시점)는 장애나 재해 때 잃어도 된다고 허용하는 데이터의 최대 분량을 시간으로 나타낸 값입니다.
- why: 백업과 복제를 얼마나 자주 해야 하는지를 정합니다.
- compare: RPO가 0이면 데이터를 하나도 잃지 않아야 한다는 뜻이고, RPO가 1시간이면 최근 1시간치는 잃을 수 있다는 뜻입니다.
- aliases: ["recovery point objective", "목표 복구 시점", "복구 목표 시점", "알피오"] · 근거: [23]

**풀 백업** — fullName: 전체 백업(Full Backup) · category: 백업
- definition: 풀 백업은 대상 데이터 전체를 통째로 복사해 두는 백업 방식입니다.
- why: 백업본 하나만 있으면 복구할 수 있어 복구가 가장 간단하고 빠릅니다.
- compare: 풀 백업은 시간과 저장 공간이 가장 많이 들어, 보통 주 1회 풀 백업에 매일 증분·차등 백업을 섞습니다.
- aliases: ["full backup", "전체 백업", "풀백업"] · 근거: [23]

**증분 백업** — fullName: 증분 백업(Incremental Backup) · category: 백업
- definition: 증분 백업은 바로 앞의 백업(풀이든 증분이든) 뒤로 바뀐 데이터만 복사하는 백업 방식입니다.
- why: 백업 시간과 저장 공간을 가장 적게 씁니다.
- compare: 증분 백업은 복구할 때 풀 백업과 그 뒤의 증분 백업을 모두 차례로 써야 하고, 차등 백업은 풀 백업과 마지막 차등 백업 두 개만 있으면 됩니다.
- aliases: ["incremental backup", "증분백업", "인크리멘탈"] · 근거: [23]

**차등 백업** — fullName: 차등 백업(Differential Backup) · category: 백업
- definition: 차등 백업은 마지막 풀 백업 뒤로 바뀐 데이터를 매번 모두 복사하는 백업 방식입니다.
- why: 증분 백업보다 복구가 간단하고 풀 백업보다 빠르게 끝납니다.
- compare: 차등 백업은 날이 갈수록 백업 크기가 커지고, 증분 백업은 매번 작습니다.
- aliases: ["differential backup", "차등백업", "디퍼렌셜"] · 근거: [23]

**스냅샷** — fullName: 스냅샷(Snapshot) · category: 백업
- definition: 스냅샷은 디스크나 데이터의 어느 한 순간 상태를 기록해 두어 나중에 그 시점으로 되돌릴 수 있게 하는 기능입니다.
- why: 작업 전에 몇 초 만에 찍어 두고 문제가 생기면 빠르게 되돌립니다.
- compare: 스냅샷은 보통 원본과 같은 저장 장치에 있어 장치가 고장 나면 함께 잃을 수 있고, 백업은 다른 곳에 따로 둔 사본입니다.
- aliases: ["snapshot", "스냅샷", "스냅숏", "시점 복사"] · 근거: [32]

**아카이빙** — fullName: 아카이빙(Archiving, 장기 보관) · category: 백업 / 보관
- definition: 아카이빙은 자주 쓰지 않지만 법이나 규정 때문에 남겨야 하는 데이터를 운영 저장소에서 빼내 값싼 저장소에 오래 보관하는 것입니다.
- why: 운영 데이터베이스를 가볍게 유지하면서 보존 의무를 지킵니다.
- compare: 백업은 되살리기 위한 사본이고, 아카이빙은 원본을 옮겨 보관하는 것입니다.
- aliases: ["archiving", "archive", "아카이브", "장기 보관", "데이터 보관"] · 근거: —

#### 데이터 · 확장

**샤딩** — fullName: 샤딩(Sharding, 수평 분할) · category: 데이터 / 확장
- definition: 샤딩은 같은 구조의 데이터를 정한 기준(예: 회원 번호)에 따라 여러 데이터베이스 서버에 나누어 저장하는 방식입니다.
- why: 데이터베이스 한 대로 감당할 수 없는 데이터양과 쓰기 요청을 여러 대로 나눕니다.
- compare: 샤딩은 여러 서버로 나누고, 파티셔닝은 한 서버 안에서 표를 나눕니다.
- aliases: ["sharding", "shard", "샤드", "수평 분할", "db 분산"] · 근거: —

**파티셔닝** — fullName: 파티셔닝(Partitioning) · category: 데이터 / 성능
- definition: 파티셔닝은 큰 표 하나를 날짜나 범위 같은 기준으로 여러 조각(파티션)으로 나누어 한 데이터베이스 안에 저장하는 방식입니다.
- why: 필요한 조각만 읽어 조회가 빨라지고 오래된 데이터를 조각째 지우거나 옮기기 쉽습니다.
- compare: 파티셔닝은 프로그램에서는 여전히 표 하나로 보이고, 샤딩은 어느 서버로 갈지 따로 정해 줘야 합니다.
- aliases: ["partitioning", "partition", "파티션", "테이블 파티셔닝"] · 근거: —

**커넥션 풀** — fullName: 커넥션 풀(Connection Pool) · category: 데이터 / 성능
- definition: 커넥션 풀은 애플리케이션이 데이터베이스 연결을 미리 여러 개 만들어 두고 필요할 때 빌려 쓰고 돌려주는 방식입니다.
- why: 요청마다 연결을 새로 맺는 시간을 없애고 데이터베이스에 붙는 연결 수를 제한합니다.
- compare: 커넥션 풀은 WAS 안에 있는 기능이고, DB 중계(Proxy)는 WAS와 DB 사이에 따로 두는 서버입니다.
- aliases: ["connection pool", "dbcp", "hikaricp", "커넥션풀", "연결 풀", "데이터소스"] · 근거: —

**읽기 전용 복제본** — fullName: 읽기 전용 복제본(Read Replica) · category: 데이터 / 확장
- definition: 읽기 전용 복제본은 원본 데이터베이스의 변경을 계속 받아 같은 데이터를 갖고 조회 요청만 처리하는 복제 데이터베이스입니다.
- why: 조회 요청을 복제본으로 돌려 원본 데이터베이스의 부담을 줄입니다.
- compare: 읽기 전용 복제본은 평소에도 조회를 처리하고, Standby는 장애 때 넘겨받으려고 대기합니다.
- aliases: ["read replica", "리드 레플리카", "읽기 복제본", "슬레이브", "replica", "조회용 DB"] · 근거: [35]

**스케일 업** — fullName: 스케일 업(Scale-up, 수직 확장) · category: 확장
- definition: 스케일 업은 서버 한 대의 CPU·메모리·디스크를 더 큰 것으로 바꿔 처리 능력을 높이는 방식입니다.
- why: 프로그램을 고치지 않고 가장 간단하게 성능을 올립니다.
- compare: 스케일 업은 한 대를 키우는 것이라 한계가 있고, 스케일 아웃은 대수를 늘리는 것이라 한계가 덜합니다.
- aliases: ["scale up", "scale-up", "수직 확장", "스케일업", "증설"] · 근거: —

**스케일 아웃** — fullName: 스케일 아웃(Scale-out, 수평 확장) · category: 확장
- definition: 스케일 아웃은 같은 서버의 대수를 늘려 요청을 나누어 처리함으로써 처리 능력을 높이는 방식입니다.
- why: 서버를 더하는 만큼 처리량이 늘고 한 대가 고장 나도 나머지가 처리합니다.
- compare: 스케일 아웃은 앞에 로드밸런서가 필요하고 서버가 상태를 갖지 않게 만들어야 하며, 스케일 업은 그런 준비가 필요 없습니다.
- aliases: ["scale out", "scale-out", "수평 확장", "스케일아웃", "증설"] · 근거: —

**용량 산정** — fullName: 용량 산정(Capacity Sizing, 사이징) · category: 설계 / 규모 산정
- definition: 용량 산정은 예상 사용자 수와 업무량으로부터 필요한 서버의 CPU·메모리·디스크 규모를 계산해 정하는 작업입니다.
- why: 장비를 너무 작게 사서 서비스가 느려지거나 너무 크게 사서 예산을 낭비하는 일을 막습니다.
- compare: 공공 정보화 사업에서는 TTA 표준 "정보시스템 하드웨어 규모산정 지침"의 계산식을 기준으로 삼습니다.
- aliases: ["sizing", "사이징", "규모 산정", "capacity planning", "용량 계획", "하드웨어 규모산정"] · 근거: [16]

**tpmC** — fullName: transactions per minute, TPC-C · category: 설계 / 성능 지표
- definition: tpmC는 TPC-C라는 표준 성능 시험에서 서버가 1분 동안 처리한 주문 거래 수를 나타내는 온라인 거래 처리 성능 단위입니다.
- why: 제조사가 다른 서버의 처리 능력을 같은 잣대로 비교하고 필요한 서버 규모를 숫자로 계산합니다.
- compare: tpmC는 데이터베이스 거래 처리 성능이고, WAS 성능은 보통 다른 지표(max-jOPS 등)로 따로 산정합니다.
- aliases: ["tpmc", "tpc-c", "티피엠씨", "tpm"] · 근거: [16][40]

#### 인프라 위치 · 클라우드 형태

**온프레미스** — fullName: 온프레미스(On-premises) · category: 인프라 형태
- definition: 온프레미스는 회사가 서버와 장비를 직접 사서 자기 전산실이나 임대한 IDC에 두고 운영하는 방식입니다.
- why: 데이터와 장비를 직접 통제해야 하거나 규제상 외부에 둘 수 없을 때 씁니다.
- compare: 온프레미스는 장비를 사서 직접 운영하고, 클라우드는 사업자의 자원을 빌려 쓴 만큼 냅니다.
- aliases: ["on-premises", "on-premise", "on-prem", "온프렘", "온프레미스", "자체 구축", "레거시 환경"] · 근거: —

**IDC** — fullName: 인터넷 데이터 센터(Internet Data Center) · category: 인프라 형태 / 시설
- definition: IDC(인터넷 데이터 센터)는 서버와 네트워크 장비를 모아 두고 전원·냉방·회선·보안을 갖춰 운영하는 전용 건물입니다.
- why: 회사가 직접 갖추기 어려운 안정적인 전원·냉방·통신 회선을 빌려 씁니다.
- compare: IDC는 장비를 두는 건물이고, 클라우드는 그런 건물 안의 자원을 서비스로 빌려주는 것입니다.
- aliases: ["internet data center", "데이터센터", "데이터 센터", "전산센터", "dc", "아이디씨"] · 근거: —

**코로케이션** — fullName: 코로케이션(Colocation) · category: 인프라 형태
- definition: 코로케이션은 회사가 가진 서버를 IDC에 가져다 두고 공간(상면)·전원·회선만 빌려 쓰는 방식입니다.
- why: 전산실을 직접 짓지 않고도 내 장비를 안정적인 시설에서 운영합니다.
- compare: 코로케이션은 장비가 내 것이고, 서버 호스팅은 장비까지 빌립니다.
- aliases: ["colocation", "colo", "코로", "상면 임대", "하우징"] · 근거: —

**호스팅** — fullName: 호스팅(Hosting) · category: 인프라 형태
- definition: 호스팅은 사업자가 가진 서버나 그 일부를 빌려 웹 사이트나 시스템을 올려 운영하는 방식입니다.
- why: 장비를 사지 않고 달마다 요금을 내며 서버를 씁니다.
- compare: 호스팅은 보통 정해진 사양을 월 단위로 빌리고, 클라우드는 필요할 때 바로 늘리고 줄이며 쓴 만큼 냅니다.
- aliases: ["hosting", "서버 호스팅", "웹 호스팅", "임대 서버"] · 근거: —

**하이브리드 클라우드** — fullName: 하이브리드 클라우드(Hybrid Cloud) · category: 클라우드 형태
- definition: 하이브리드 클라우드는 온프레미스(또는 사설 클라우드)와 퍼블릭 클라우드를 연결해 함께 쓰는 구성입니다.
- why: 중요한 데이터는 내부에 두고, 늘었다 줄었다 하는 업무는 클라우드에서 처리합니다.
- compare: 하이브리드 클라우드는 내부와 클라우드를 섞은 것이고, 멀티 클라우드는 클라우드 사업자를 둘 이상 쓰는 것입니다.
- aliases: ["hybrid cloud", "하이브리드", "하이브리드 구성"] · 근거: [31]

**멀티 클라우드** — fullName: 멀티 클라우드(Multi-cloud) · category: 클라우드 형태
- definition: 멀티 클라우드는 둘 이상의 클라우드 사업자(예: AWS와 NCP)를 함께 쓰는 구성입니다.
- why: 한 사업자의 장애나 가격·정책 변화에 묶이지 않게 합니다.
- compare: 멀티 클라우드는 사업자가 여럿이라는 뜻이고, 온프레미스와 섞는지는 따지지 않습니다.
- aliases: ["multi cloud", "multicloud", "멀티클라우드", "복수 클라우드"] · 근거: —

**IaaS** — fullName: 서비스형 인프라(Infrastructure as a Service) · category: 클라우드 서비스 모델
- definition: IaaS(서비스형 인프라)는 가상 서버·저장소·네트워크 같은 인프라 자원을 빌려 쓰고 운영체제부터는 사용자가 직접 관리하는 클라우드 서비스 모델입니다.
- why: 장비를 사지 않고도 온프레미스와 같은 자유도로 서버를 구성합니다.
- compare: IaaS는 서버까지 빌리고, PaaS는 프로그램 실행 환경까지, SaaS는 완성된 프로그램까지 빌립니다.
- aliases: ["infrastructure as a service", "이아스", "아이아스", "서비스형 인프라"] · 근거: [31]

**PaaS** — fullName: 서비스형 플랫폼(Platform as a Service) · category: 클라우드 서비스 모델
- definition: PaaS(서비스형 플랫폼)는 운영체제·미들웨어·실행 환경을 사업자가 관리하고 사용자는 자기 프로그램만 올려 실행하는 클라우드 서비스 모델입니다.
- why: 서버와 미들웨어 운영을 맡기고 프로그램 개발에 집중합니다.
- compare: PaaS는 내 프로그램을 올리는 곳이고, SaaS는 남이 만든 프로그램을 그대로 쓰는 것입니다.
- aliases: ["platform as a service", "파스", "서비스형 플랫폼"] · 근거: [31]

**SaaS** — fullName: 서비스형 소프트웨어(Software as a Service) · category: 클라우드 서비스 모델
- definition: SaaS(서비스형 소프트웨어)는 사업자가 운영하는 완성된 소프트웨어를 설치 없이 인터넷으로 접속해 쓰는 클라우드 서비스 모델입니다.
- why: 설치·업그레이드·운영 없이 필요한 기능을 바로 씁니다.
- compare: SaaS는 구독해서 쓰고, 설치형(구축형) 소프트웨어는 사서 내 서버에 설치합니다.
- aliases: ["software as a service", "사스", "싸스", "서비스형 소프트웨어", "구독형"] · 근거: [31]

**리전** — fullName: 리전(Region) · category: 클라우드 / 위치
- definition: 리전은 클라우드 사업자가 데이터센터들을 묶어 운영하는 지리적 구역(예: 서울 리전)입니다.
- why: 사용자와 가까운 곳에 두어 응답을 빠르게 하고, 데이터를 어느 나라에 둘지 정합니다.
- compare: 리전은 여러 가용 영역(AZ)으로 이루어지며, 리전끼리는 수백 km 이상 떨어져 재해복구에 씁니다.
- aliases: ["region", "서울 리전", "리젼", "ap-northeast-2"] · 근거: [35]

**테넌트** — fullName: 테넌트(Tenant) · category: 클라우드 / 사용 단위
- definition: 테넌트는 여러 고객이 함께 쓰는 시스템에서 데이터와 설정이 서로 분리된 고객(조직) 한 단위를 뜻합니다.
- why: 같은 시스템을 여러 고객이 나눠 쓰면서도 서로의 데이터를 볼 수 없게 합니다.
- compare: 멀티 테넌트는 여러 고객이 한 시스템을 나눠 쓰고, 싱글 테넌트는 고객마다 시스템을 따로 둡니다.
- aliases: ["tenant", "멀티 테넌트", "multi-tenant", "테넌시", "tenancy"] · 근거: —

#### 환경 · 배포 · 운영

**운영계** — fullName: 운영 환경(Production) · category: 환경 구분
- definition: 운영계는 실제 사용자가 접속해 실제 데이터로 쓰는 본 서비스 환경입니다.
- why: 실제 업무가 일어나는 곳이라 변경과 접근을 가장 엄격하게 통제합니다.
- compare: 운영계는 실제 서비스이고, 개발계·검증계는 운영에 반영하기 전에 만들고 확인하는 환경입니다.
- aliases: ["production", "prod", "prd", "운영 환경", "운영 서버", "실서버", "리얼", "프로덕션"] · 근거: —

**개발계** — fullName: 개발 환경(Development) · category: 환경 구분
- definition: 개발계는 개발자가 프로그램을 만들고 바로 올려서 동작을 확인하는 환경입니다.
- why: 운영 서비스에 영향을 주지 않고 자유롭게 만들고 고칩니다.
- compare: 개발계는 자주 바뀌고 불안정해도 되고, 검증계는 운영과 비슷하게 맞춰 두고 확인용으로 씁니다.
- aliases: ["development", "dev", "개발 환경", "개발 서버", "데브"] · 근거: —

**검증계** — fullName: 검증 환경(Test / QA) · category: 환경 구분
- definition: 검증계는 개발을 마친 프로그램을 운영에 올리기 전에 기능과 성능을 시험하는 환경으로, 테스트계·QA 환경이라고도 부릅니다.
- why: 운영에 올리기 전에 오류를 찾아 실제 사용자가 겪지 않게 합니다.
- compare: 검증계와 스테이징은 조직마다 같은 뜻으로도 쓰고, 검증계는 기능 시험용·스테이징은 운영 직전 최종 확인용으로 나누어 쓰기도 합니다.
- aliases: ["test", "qa", "stg", "테스트계", "검증 환경", "테스트 서버", "품질계"] · 근거: —

**스테이징** — fullName: 스테이징 환경(Staging) · category: 환경 구분
- definition: 스테이징은 운영 환경과 구성을 최대한 똑같이 맞춰 두고 배포 직전에 마지막으로 확인하는 환경입니다.
- why: 운영과 같은 조건에서 미리 돌려 보아 배포 때 생길 문제를 줄입니다.
- compare: 스테이징은 운영과 구성이 같아야 의미가 있고, 개발계는 운영과 달라도 됩니다.
- aliases: ["staging", "stage", "stg", "스테이지", "준운영", "사전 운영"] · 근거: —

**무중단 배포** — fullName: 무중단 배포(Zero-downtime Deployment) · category: 배포
- definition: 무중단 배포는 새 버전을 올리는 동안에도 사용자가 서비스를 끊김 없이 쓸 수 있게 하는 배포 방식을 통틀어 부르는 말입니다.
- why: 배포 때문에 서비스를 멈추거나 야간 점검 시간을 잡지 않아도 됩니다.
- compare: 롤링·블루그린·카나리가 모두 무중단 배포의 구체적인 방법입니다.
- aliases: ["zero downtime deployment", "무정지 배포", "무중단"] · 근거: —

**롤링 배포** — fullName: 롤링 배포(Rolling Deployment) · category: 배포
- definition: 롤링 배포는 서버 여러 대를 한 대(또는 몇 대)씩 차례로 새 버전으로 바꿔 가는 배포 방식입니다.
- why: 서버를 추가로 마련하지 않고도 서비스를 멈추지 않고 배포합니다.
- compare: 롤링 배포는 배포 도중 옛 버전과 새 버전이 함께 돌고, 블루그린 배포는 한 번에 통째로 바꿉니다.
- aliases: ["rolling update", "rolling deployment", "롤링 업데이트", "순차 배포"] · 근거: [39]

**블루그린 배포** — fullName: 블루그린 배포(Blue-Green Deployment) · category: 배포
- definition: 블루그린 배포는 지금 버전(블루)과 똑같은 환경을 하나 더 만들어 새 버전(그린)을 올린 뒤 접속을 한 번에 그쪽으로 돌리는 배포 방식입니다.
- why: 문제가 생기면 접속을 이전 환경으로 되돌리기만 하면 되어 복구가 빠릅니다.
- compare: 블루그린 배포는 환경이 두 벌 필요해 비용이 들고, 롤링 배포는 한 벌로 됩니다.
- aliases: ["blue green", "blue/green", "블루 그린", "블루그린"] · 근거: —

**카나리 배포** — fullName: 카나리 배포(Canary Deployment) · category: 배포
- definition: 카나리 배포는 새 버전을 일부 사용자나 일부 서버에만 먼저 내보내 문제가 없는지 본 뒤 점차 전체로 넓히는 배포 방식입니다.
- why: 새 버전의 문제가 전체 사용자에게 퍼지기 전에 적은 범위에서 먼저 드러나게 합니다.
- compare: 카나리 배포는 접속 비율을 조금씩 옮기고, 블루그린 배포는 한 번에 모두 옮깁니다.
- aliases: ["canary", "canary release", "카나리", "카나리아 배포", "점진 배포"] · 근거: —

**형상관리** — fullName: 형상관리(Configuration Management, 버전 관리) · category: 운영 / 개발 관리
- definition: 형상관리는 소스 코드와 설정 파일이 누가 언제 어떻게 바꿨는지를 기록하고 버전별로 보관하는 일, 또는 그런 도구(Git, SVN 등)를 뜻합니다.
- why: 변경 이력을 추적하고 문제가 생기면 이전 버전으로 되돌립니다.
- compare: 형상관리는 소스의 변경을 기록하고, CI/CD는 그 소스를 빌드해 서버에 올리는 과정을 자동으로 돌립니다.
- aliases: ["scm", "version control", "vcs", "git", "svn", "버전 관리", "소스 관리", "형상 관리"] · 근거: —

**PM(정기점검)** — fullName: 예방 점검(Preventive Maintenance) · category: 운영
- definition: PM(Preventive Maintenance)은 장애가 나기 전에 미리 시간을 정해 시스템을 점검하고 패치·부품 교체를 하는 정기 작업입니다.
- why: 고장을 미리 찾아 막고, 서비스에 영향을 주는 작업을 사용자가 적은 시간에 모아서 합니다.
- compare: 운영 용어 PM은 정기점검이고, 사업 관리 용어 PM은 프로젝트 관리자(Project Manager)입니다.
- aliases: ["preventive maintenance", "정기점검", "정기 점검", "pm 작업", "예방 점검", "시스템 점검"] · 근거: —

**APM** — fullName: 애플리케이션 성능 모니터링(Application Performance Monitoring) · category: 모니터링
- definition: APM(애플리케이션 성능 모니터링)은 애플리케이션의 응답 시간·처리량·오류와 느린 지점을 실시간으로 추적해 보여 주는 도구나 활동입니다.
- why: 서비스가 느려졌을 때 어느 화면·어느 SQL·어느 서버가 원인인지 빨리 찾습니다.
- compare: APM은 프로그램 안쪽의 처리 흐름을 보고, 인프라 모니터링은 서버의 CPU·메모리·디스크 상태를 봅니다.
- aliases: ["application performance monitoring", "application performance management", "에이피엠", "성능 모니터링"] · 근거: [21][28]

**IaC** — fullName: 코드형 인프라(Infrastructure as Code) · category: 운영 / 자동화
- definition: IaC(코드형 인프라)는 서버·네트워크 같은 인프라 구성을 손으로 설정하지 않고 코드 파일로 적어 자동으로 만들고 바꾸는 방식입니다.
- why: 같은 환경을 실수 없이 반복해서 만들고 변경 이력을 코드로 남깁니다.
- compare: IaC는 인프라를 만드는 일을 자동화하고, CI/CD는 프로그램을 빌드·배포하는 일을 자동화합니다.
- aliases: ["infrastructure as code", "코드형 인프라", "인프라 코드", "아이에이씨"] · 근거: [5]

**서비스 메시** — fullName: 서비스 메시(Service Mesh) · category: 쿠버네티스 / 네트워킹
- definition: 서비스 메시는 여러 서비스 사이의 통신을 서비스마다 붙인 프록시가 대신 처리하게 해 암호화·경로 제어·관측을 한곳에서 관리하는 인프라 계층입니다.
- why: 서비스마다 통신 관련 코드를 넣지 않고도 보안과 장애 대응 규칙을 똑같이 적용합니다.
- compare: 서비스 메시는 내부 서비스끼리의 통신을 다루고, API 게이트웨이는 외부에서 들어오는 요청을 다룹니다.
- aliases: ["service mesh", "서비스메시", "사이드카", "sidecar", "istio"] · 근거: [24]

**컨테이너 레지스트리** — fullName: 컨테이너 이미지 레지스트리(Container Registry) · category: 컨테이너
- definition: 컨테이너 레지스트리는 빌드한 컨테이너 이미지를 버전별로 저장해 두고 서버나 쿠버네티스가 내려받아 실행하게 하는 저장소입니다.
- why: 배포할 이미지를 한곳에 모아 두고 접근 권한을 관리합니다.
- compare: 컨테이너 레지스트리는 실행할 이미지를 보관하고, 형상관리 저장소(Git)는 소스 코드를 보관합니다.
- aliases: ["container registry", "image registry", "이미지 저장소", "레지스트리", "ecr", "docker hub"] · 근거: [24]

#### 미들웨어 · 연계 · 금융 SI

**TP 모니터** — fullName: 트랜잭션 처리 모니터(Transaction Processing Monitor) · category: 미들웨어
- definition: TP 모니터는 많은 사용자의 거래 요청을 받아 업무 프로그램에 나누어 주고 거래가 모두 성공하거나 모두 취소되도록 관리하는 미들웨어입니다.
- why: 대량의 거래를 적은 자원으로 안정되게 처리하고 여러 DB에 걸친 거래의 일관성을 지킵니다.
- compare: TP 모니터는 주로 C·COBOL 업무 프로그램을 실행하고, WAS는 자바 웹 프로그램을 실행합니다.
- aliases: ["tp monitor", "tpm", "tp-monitor", "티피 모니터", "트랜잭션 미들웨어"] · 근거: [29]

**EAI** — fullName: 기업 애플리케이션 통합(Enterprise Application Integration) · category: 미들웨어 / 연계
- definition: EAI(기업 애플리케이션 통합)는 회사 안의 여러 시스템이 데이터를 주고받을 때 가운데에서 형식을 바꾸고 전달 경로를 관리해 주는 연계 솔루션입니다.
- why: 시스템끼리 일일이 직접 연결하지 않고 한곳에서 연결과 이력을 관리합니다.
- compare: EAI는 내부 시스템끼리의 연계를 맡고, FEP는 외부 기관과의 연계를 맡습니다.
- aliases: ["enterprise application integration", "이에이아이", "내부 연계", "연계 서버"] · 근거: [22]

**ESB** — fullName: 엔터프라이즈 서비스 버스(Enterprise Service Bus) · category: 미들웨어 / 연계
- definition: ESB(엔터프라이즈 서비스 버스)는 시스템들의 기능을 표준 방식의 서비스로 만들어 공용 통로(버스)에 연결하고 그 사이의 전달·변환을 맡는 연계 미들웨어입니다.
- why: 시스템을 표준 서비스 단위로 연결해 하나를 바꿔도 다른 시스템이 영향을 덜 받게 합니다.
- compare: EAI는 가운데 허브에 모으는 방식에서 출발했고, ESB는 표준 규격(웹 서비스 등)으로 느슨하게 연결하는 데 무게를 둡니다.
- aliases: ["enterprise service bus", "이에스비", "서비스 버스"] · 근거: [22]

**MCI** — fullName: 멀티 채널 통합(Multi Channel Integration) · category: 미들웨어 / 연계 (금융)
- definition: MCI(멀티 채널 통합)는 창구 단말·ATM·인터넷뱅킹·모바일 같은 여러 채널의 요청을 한곳에서 받아 표준 전문으로 바꿔 업무 시스템에 전달하는 금융권 연계 솔루션입니다.
- why: 채널이 늘어도 업무 시스템을 고치지 않고 한곳에서 받아 넘기게 합니다.
- compare: MCI는 채널과 내부 업무 시스템 사이를, FEP는 내부 시스템과 외부 기관 사이를 잇습니다.
- aliases: ["multi channel integration", "mca", "엠씨아이", "채널 통합"] · 근거: [22]

**FEP** — fullName: 대외계 연계 시스템(Front-End Processor) · category: 미들웨어 / 연계 (금융)
- definition: FEP(Front-End Processor)는 국내 금융권에서 금융결제원·카드사·타 은행 같은 외부 기관과 전용선으로 전문을 주고받는 대외 연계 시스템을 가리킵니다.
- why: 기관마다 다른 통신 방식과 전문 형식을 한곳에서 맞춰 주고 대외 거래를 통제합니다.
- compare: FEP는 원래 메인프레임 앞단의 통신 처리 장치를 뜻했지만, 국내 금융 SI에서는 대외 기관 연계 시스템이라는 뜻으로 씁니다.
- aliases: ["front-end processor", "에프이피", "대외계 서버", "대외 연계", "대외계 시스템"] · 근거: [22]

**API 관리** — fullName: API 관리(API Management, APIM) · category: 미들웨어 / 연계
- definition: API 관리는 API의 등록·인증키 발급·사용량 제한·통계·개발자 안내 사이트를 한데 묶어 운영하는 솔루션이나 활동입니다.
- why: 누가 어떤 API를 얼마나 쓰는지 통제하고 외부 개발자에게 API를 안전하게 공개합니다.
- compare: API 게이트웨이는 요청을 받아 넘기는 관문이고, API 관리는 게이트웨이에 등록·통계·포털까지 더한 전체 체계입니다.
- aliases: ["api management", "apim", "api 관리 플랫폼", "오픈 API 플랫폼"] · 근거: —

**배치 스케줄러** — fullName: 배치 스케줄러(Batch Scheduler, 작업 스케줄러) · category: 미들웨어 / 배치
- definition: 배치 스케줄러는 배치 작업을 정해진 시각과 순서에 맞춰 자동으로 실행하고 성공·실패를 기록하는 소프트웨어입니다.
- why: 수백 개의 야간 작업을 사람 손 없이 순서대로 돌리고 실패하면 바로 알립니다.
- compare: 배치 스케줄러는 "언제 무엇을 돌릴지"를 관리하고, 배치 서버는 그 작업이 실제로 실행되는 곳입니다.
- aliases: ["batch scheduler", "job scheduler", "작업 스케줄러", "잡 스케줄러", "워크로드 자동화"] · 근거: —

**ETL** — fullName: 추출·변환·적재(Extract, Transform, Load) · category: 데이터 / 연계
- definition: ETL은 운영 시스템의 데이터를 꺼내(추출) 분석에 맞는 모양으로 바꾼(변환) 뒤 데이터 웨어하우스 같은 곳에 넣는(적재) 작업이나 도구입니다.
- why: 여러 시스템에 흩어진 데이터를 한곳에 모아 통계와 분석에 쓰게 합니다.
- compare: ETL은 보통 정해진 시간에 한꺼번에 옮기고, CDC는 바뀐 내용만 실시간에 가깝게 옮깁니다.
- aliases: ["extract transform load", "elt", "이티엘", "데이터 이관", "데이터 적재"] · 근거: —

**CDC** — fullName: 변경 데이터 캡처(Change Data Capture) · category: 데이터 / 연계
- definition: CDC(변경 데이터 캡처)는 데이터베이스에서 추가·수정·삭제된 내용만 변경 기록(로그)에서 읽어 내 다른 시스템으로 전달하는 기술입니다.
- why: 원본 데이터베이스에 부담을 거의 주지 않고 다른 시스템을 실시간에 가깝게 맞춥니다.
- compare: CDC는 종류가 다른 시스템으로도 변경분을 보낼 수 있고, DB 복제는 보통 같은 종류의 DB끼리 통째로 맞춥니다.
- aliases: ["change data capture", "씨디씨", "변경 데이터 캡처", "실시간 복제"] · 근거: [15]

**리포팅 툴** — fullName: 리포팅 툴(Reporting Tool, 보고서 솔루션) · category: 미들웨어 / 출력
- definition: 리포팅 툴은 데이터베이스의 데이터를 정해진 양식의 보고서·증명서·전표 화면으로 만들어 보여 주고 인쇄하거나 PDF·엑셀로 내보내는 솔루션입니다.
- why: 양식이 복잡한 문서를 화면마다 직접 개발하지 않고 양식 파일로 만들어 씁니다.
- compare: 리포팅 툴은 정해진 양식의 문서를 찍어 내고, BI 도구는 사용자가 데이터를 자유롭게 분석합니다.
- aliases: ["reporting tool", "리포트 툴", "리포트 서버", "레포팅 툴", "보고서 툴"] · 근거: — (국내 주요 제품 이름은 미확인이라 넣지 않았습니다)

**SSO** — fullName: 통합 인증(Single Sign-On) · category: 미들웨어 / 인증
- definition: SSO(통합 인증)는 한 번 로그인하면 연결된 여러 시스템을 다시 로그인하지 않고 쓸 수 있게 하는 인증 방식, 또는 그 일을 하는 서버입니다.
- why: 시스템마다 따로 로그인하는 불편을 없애고 계정을 한곳에서 관리합니다.
- compare: SSO는 "누구인지"를 한 번에 확인하고, EAM은 "무엇을 할 수 있는지"까지 관리합니다.
- aliases: ["single sign-on", "single sign on", "통합 로그인", "통합 인증", "에스에스오"] · 근거: — (보안 세부는 다른 조사에서 다룹니다)

**EAM** — fullName: 통합 접근 관리(Enterprise/Extranet Access Management) · category: 미들웨어 / 인증·권한
- definition: EAM(통합 접근 관리)은 통합 인증(SSO)에 더해 사용자별로 어느 시스템의 어떤 메뉴와 기능을 쓸 수 있는지 권한을 한곳에서 관리하는 솔루션입니다.
- why: 인사 정보에 따라 여러 시스템의 권한을 한 번에 주고 거둡니다.
- compare: EAM은 SSO에 권한 관리를 더한 것입니다.
- aliases: ["enterprise access management", "extranet access management", "통합 권한 관리", "이에이엠"] · 근거: — (정식 명칭 표기는 문서마다 달라 확인 필요)

**연계(인터페이스)** — fullName: 시스템 연계(Interface, I/F) · category: 연계
- definition: 연계(인터페이스)는 서로 다른 시스템이 정해진 형식과 방식으로 데이터를 주고받는 것, 또는 그 연결 한 건을 뜻합니다.
- why: 시스템마다 따로 가진 데이터를 서로 맞추고 업무를 이어지게 합니다.
- compare: 온라인 연계는 요청 즉시 주고받고, 배치 연계는 정해진 시간에 파일 등으로 한꺼번에 주고받습니다.
- aliases: ["interface", "i/f", "if", "인터페이스", "연동", "시스템 연계", "전문 연계"] · 근거: [22]

**배치** — fullName: 배치 처리(Batch Processing, 일괄 처리) · category: 처리 방식
- definition: 배치는 데이터를 모아 두었다가 정해진 시각에 한꺼번에 처리하는 방식, 또는 그렇게 도는 작업을 뜻합니다.
- why: 정산·마감·통계처럼 양이 많은 작업을 사용자가 적은 시간에 몰아서 처리합니다.
- compare: 배치는 모아서 나중에 처리하고, 온라인 트랜잭션은 요청이 오는 즉시 처리합니다.
- aliases: ["batch", "batch job", "일괄 처리", "배치 작업", "야간 배치", "일 마감"] · 근거: —

**온라인 트랜잭션** — fullName: 온라인 트랜잭션 처리(Online Transaction Processing, OLTP) · category: 처리 방식
- definition: 온라인 트랜잭션은 사용자의 요청(조회·이체·주문 등)을 받는 즉시 처리해 바로 결과를 돌려주는 거래 처리 방식입니다.
- why: 사용자가 기다리는 동안 몇 초 안에 거래를 끝내야 하는 업무를 처리합니다.
- compare: 온라인 트랜잭션(OLTP)은 짧은 거래를 아주 많이 처리하고, 분석 처리(OLAP)는 많은 데이터를 오래 걸려 집계합니다.
- aliases: ["oltp", "online transaction", "온라인 거래", "온라인 처리", "실시간 거래"] · 근거: [40]

**채널계** — fullName: 채널계(Channel System) · category: 금융 SI / 시스템 구분
- definition: 채널계는 금융 회사에서 영업점 창구·ATM·인터넷뱅킹·모바일뱅킹처럼 고객이 거래를 요청하는 접점 시스템들을 묶어 부르는 말입니다.
- why: 고객 접점이 늘거나 바뀌어도 핵심 업무 시스템(계정계)을 건드리지 않게 구역을 나눕니다.
- compare: 채널계는 요청을 받는 곳이고, 계정계는 그 거래를 실제로 처리해 원장에 기록하는 곳입니다.
- aliases: ["channel", "채널 시스템", "대고객 채널", "비대면 채널"] · 근거: [22]

**계정계** — fullName: 계정계(Core Banking System, 기간계) · category: 금융 SI / 시스템 구분
- definition: 계정계는 금융 회사에서 예금·대출·외환 같은 실제 거래를 처리하고 고객 계좌 원장을 관리하는 핵심 시스템을 가리키며, 기간계라고도 부릅니다.
- why: 돈이 오가는 거래와 원장을 다루므로 가장 높은 안정성과 정확성이 필요한 구역으로 따로 관리합니다.
- compare: 계정계는 거래를 실시간으로 처리하고, 정보계는 그 거래 데이터를 모아 분석합니다.
- aliases: ["core banking", "기간계", "코어뱅킹", "원장 시스템", "계정 시스템"] · 근거: [22]

**정보계** — fullName: 정보계(Information System) · category: 금융 SI / 시스템 구분
- definition: 정보계는 금융 회사에서 계정계에 쌓인 거래 데이터를 모아 통계·분석·경영 보고에 쓰는 시스템들(데이터 웨어하우스 등)을 가리킵니다.
- why: 분석용 조회가 거래 처리를 느리게 하지 않도록 데이터를 따로 옮겨 놓고 씁니다.
- compare: 정보계는 주로 지난 데이터를 조회·집계하고, 계정계는 지금 일어나는 거래를 기록합니다.
- aliases: ["information system", "정보 시스템", "dw", "분석계", "경영정보계"] · 근거: [22]

**대외계** — fullName: 대외계(External Interface System) · category: 금융 SI / 시스템 구분
- definition: 대외계는 금융 회사에서 금융결제원·타 은행·카드사·신용정보기관 같은 외부 기관과 전문을 주고받는 연계 시스템 구역을 가리킵니다.
- why: 외부 기관과의 연결을 한 구역에 모아 통신 방식 차이를 흡수하고 보안을 통제합니다.
- compare: 대외계는 구역(영역)의 이름이고, FEP는 그 구역에서 실제로 연계를 처리하는 시스템입니다.
- aliases: ["대외 시스템", "대외기관 연계", "대외 연계계", "fep"] · 근거: [22]

### 2-D. 프로토콜 · 포트 (why·compare 채움)

포트 번호는 기본값이며 현장에서 바꿔 쓰는 경우가 많습니다.

**포트** — fullName: 포트 번호(Port Number) · category: 프로토콜 / 기본 개념
- definition: 포트는 서버 한 대 안에서 여러 프로그램 가운데 어느 프로그램으로 가는 통신인지 구분하는 0~65535 사이의 번호입니다.
- why: IP 주소 하나로 웹·DB·원격 접속 같은 여러 서비스를 동시에 받게 합니다.
- compare: IP 주소는 어느 서버인지를 가리키고, 포트는 그 서버 안의 어느 프로그램인지를 가리킵니다.
- aliases: ["port", "포트 번호", "tcp 포트", "서비스 포트", "리슨 포트"] · 근거: [33]

**HTTP** — fullName: HyperText Transfer Protocol · category: 프로토콜 / 웹
- definition: HTTP(HyperText Transfer Protocol)는 브라우저와 웹 서버가 요청과 응답을 주고받는 웹의 기본 통신 규약으로, 기본 포트는 80입니다.
- why: 웹 페이지와 API 호출이 모두 이 규약으로 오갑니다.
- compare: HTTP는 내용이 암호화되지 않고, HTTPS는 암호화됩니다.
- aliases: ["http", "80 포트", "에이치티티피"] · 근거: [33]

**HTTPS** — fullName: HTTP over TLS (HTTP Secure) · category: 프로토콜 / 웹
- definition: HTTPS는 HTTP 통신을 TLS로 암호화해 중간에서 엿보거나 바꾸지 못하게 한 통신 규약으로, 기본 포트는 443입니다.
- why: 로그인 정보와 개인 정보가 전송 중에 노출되지 않게 합니다.
- compare: HTTPS는 서버에 인증서가 있어야 하고, HTTP는 인증서 없이 동작합니다.
- aliases: ["https", "ssl", "tls", "443 포트", "보안 접속"] · 근거: [33]

**TCP** — fullName: 전송 제어 프로토콜(Transmission Control Protocol) · category: 프로토콜 / 전송 계층
- definition: TCP(전송 제어 프로토콜)는 먼저 연결을 맺고 데이터가 빠짐없이 순서대로 도착했는지 확인하며 보내는 전송 규약입니다.
- why: 웹·DB·파일 전송처럼 데이터가 하나도 빠지면 안 되는 통신에 씁니다.
- compare: TCP는 확인하며 보내 정확하지만 느리고, UDP는 확인 없이 보내 빠르지만 빠질 수 있습니다.
- aliases: ["tcp", "transmission control protocol", "티씨피"] · 근거: [33]

**UDP** — fullName: 사용자 데이터그램 프로토콜(User Datagram Protocol) · category: 프로토콜 / 전송 계층
- definition: UDP(사용자 데이터그램 프로토콜)는 연결을 맺지 않고 도착 확인도 없이 데이터를 바로 보내는 전송 규약입니다.
- why: DNS 조회·영상·음성처럼 조금 빠져도 되고 빠른 것이 중요한 통신에 씁니다.
- compare: UDP는 빠르지만 도착을 보장하지 않고, TCP는 도착을 보장합니다.
- aliases: ["udp", "user datagram protocol", "유디피"] · 근거: [33]

**AJP** — fullName: Apache JServ Protocol · category: 프로토콜 / 웹 서버-WAS 연결
- definition: AJP(Apache JServ Protocol)는 Apache 같은 웹 서버가 받은 요청을 뒤쪽 Tomcat 같은 WAS로 넘길 때 쓰는 전용 통신 규약으로, 기본 포트는 8009입니다.
- why: 웹 서버와 WAS 사이를 HTTP보다 가벼운 이진 형식으로 연결합니다.
- compare: AJP는 웹 서버와 WAS 사이에서만 쓰고, 외부에 열어 두면 안 되는 내부 전용 통로입니다.
- aliases: ["ajp", "ajp13", "mod_jk", "8009 포트", "에이제이피"] · 근거: [34]

**JDBC** — fullName: Java Database Connectivity · category: 프로토콜 / DB 접속 규격
- definition: JDBC(Java Database Connectivity)는 자바 프로그램이 데이터베이스에 접속해 SQL을 실행하는 표준 접속 규격(API)입니다.
- why: 데이터베이스 제품이 달라도 드라이버만 바꿔 같은 방식으로 접속합니다.
- compare: JDBC는 통신 규약이 아니라 자바의 접속 방식 표준이고, 실제 통신은 DB마다 다른 포트(Oracle 1521, MySQL 3306, PostgreSQL 5432 등)로 이루어집니다.
- aliases: ["jdbc", "jdbc 드라이버", "jdbc url", "제이디비씨"] · 근거: [34]

**SSH** — fullName: 시큐어 셸(Secure Shell) · category: 프로토콜 / 원격 접속
- definition: SSH(Secure Shell)는 서버에 암호화된 통로로 원격 접속해 명령을 실행하는 통신 규약으로, 기본 포트는 22입니다.
- why: 관리자가 떨어진 곳에서 서버를 안전하게 조작합니다.
- compare: SSH는 통신을 암호화하고, 예전 방식인 텔넷(Telnet)은 암호화하지 않습니다.
- aliases: ["ssh", "secure shell", "22 포트", "터미널 접속", "에스에스에이치"] · 근거: [33]

**SFTP** — fullName: SSH 파일 전송 프로토콜(SSH File Transfer Protocol) · category: 프로토콜 / 파일 전송
- definition: SFTP(SSH File Transfer Protocol)는 SSH의 암호화된 통로로 파일을 주고받는 통신 규약으로, SSH와 같은 22번 포트를 씁니다.
- why: 시스템 사이에 파일을 암호화해 안전하게 보냅니다.
- compare: SFTP는 SSH 위에서 동작하고, FTP는 암호화가 없으며, FTPS는 FTP에 TLS 암호화를 더한 별개의 규약입니다.
- aliases: ["sftp", "ssh ftp", "파일 전송", "에스에프티피"] · 근거: [33]

**SMTP** — fullName: 간이 우편 전송 프로토콜(Simple Mail Transfer Protocol) · category: 프로토콜 / 메일
- definition: SMTP(Simple Mail Transfer Protocol)는 메일 서버끼리, 또는 프로그램이 메일 서버로 전자우편을 보낼 때 쓰는 통신 규약으로, 기본 포트는 25(제출용 587)입니다.
- why: 시스템이 알림·인증 메일을 보낼 때 씁니다.
- compare: SMTP는 메일을 보내는 규약이고, 받은 메일을 읽는 데는 IMAP·POP3를 씁니다.
- aliases: ["smtp", "메일 서버", "메일 발송", "25 포트", "587 포트"] · 근거: [33]

**LDAP** — fullName: 경량 디렉터리 접근 프로토콜(Lightweight Directory Access Protocol) · category: 프로토콜 / 디렉터리
- definition: LDAP(Lightweight Directory Access Protocol)는 사용자·조직·권한 정보를 모아 둔 디렉터리 서버를 조회하고 인증하는 통신 규약으로, 기본 포트는 389(암호화 636)입니다.
- why: 여러 시스템이 사내 계정 정보 한 벌(Active Directory 등)을 함께 써서 로그인하게 합니다.
- compare: LDAP는 계정 정보를 조회하는 규약이고, Active Directory는 그 규약으로 접근하는 마이크로소프트의 디렉터리 서버 제품입니다.
- aliases: ["ldap", "ldaps", "active directory", "ad", "디렉터리 서버", "엘댑"] · 근거: [33]

**SNMP** — fullName: 간이 망 관리 프로토콜(Simple Network Management Protocol) · category: 프로토콜 / 장비 관리
- definition: SNMP(Simple Network Management Protocol)는 관리 서버가 스위치·서버 같은 장비의 상태 값을 읽고 장비가 이상을 알리는 통신 규약으로, UDP 161(알림 162) 포트를 씁니다.
- why: 제조사가 다른 장비들의 상태를 한 가지 방식으로 모아 모니터링합니다.
- compare: SNMP는 장비에 이미 들어 있는 기능으로 값을 읽고, 에이전트 방식은 서버에 프로그램을 따로 설치해 더 자세히 수집합니다.
- aliases: ["snmp", "snmp trap", "mib", "161 포트", "에스엔엠피"] · 근거: [33]

**NTP** — fullName: 네트워크 시간 프로토콜(Network Time Protocol) · category: 프로토콜 / 시간 동기화
- definition: NTP(Network Time Protocol)는 서버와 장비의 시계를 기준 시간 서버에 맞추는 통신 규약으로, UDP 123 포트를 씁니다.
- why: 서버마다 시간이 다르면 로그 순서가 어긋나고 인증·거래가 실패할 수 있어 모든 서버의 시간을 맞춥니다.
- compare: NTP는 시간을 맞추는 규약이고, NTP 서버(타임 서버)는 기준 시간을 알려 주는 서버입니다.
- aliases: ["ntp", "타임 서버", "시간 동기화", "chrony", "123 포트"] · 근거: [33]

## 3. 클라우드 관리형 서비스 대응표

정확히 일대일로 맞지 않는 칸은 성격이 가장 가까운 서비스를 적었습니다. "미확인"은 이번 조사에서 공식 문서로 확인하지 못한 칸입니다. AWS·Azure·GCP 칸은 널리 알려진 이름을 적었고 [35][36][37] 공식 문서 본문은 이번에 열람하지 않았습니다(이름 변경이 확인된 칸만 따로 표시).

| AWS | Azure | GCP | NCP(네이버 클라우드) | 한 줄 설명 |
|---|---|---|---|---|
| EC2 | Virtual Machines | Compute Engine | Server | 사양을 골라 만드는 가상 서버입니다. |
| EBS | Managed Disks | Persistent Disk | Block Storage | 가상 서버에 디스크처럼 붙이는 블록 스토리지입니다. |
| EFS | Azure Files | Filestore | NAS | 여러 서버가 함께 쓰는 관리형 파일 스토리지입니다. |
| S3 | Blob Storage | Cloud Storage | Object Storage | API로 넣고 꺼내는 오브젝트 스토리지입니다. |
| EKS | AKS (Azure Kubernetes Service) | GKE (Google Kubernetes Engine) | Ncloud Kubernetes Service (NKS) [9] | 관리형 쿠버네티스입니다. |
| ECS | Container Apps / Container Instances | Cloud Run | 미확인 | 쿠버네티스 없이 컨테이너를 실행하는 서비스입니다. |
| Fargate | Container Apps / Container Instances | Cloud Run / GKE Autopilot | 미확인 | 서버를 관리하지 않는 컨테이너 실행 환경입니다. |
| Lambda | Azure Functions | Cloud Run functions (구 Cloud Functions, 2024-08 개명) [11] | Cloud Functions [9] | 서버리스 함수입니다. |
| RDS | Azure SQL Database / Azure Database for MySQL·PostgreSQL | Cloud SQL | Cloud DB for MySQL 등 (제품별 세부 미확인) | 관리형 관계형 데이터베이스입니다. |
| Aurora | 딱 맞는 대응 없음 (Azure SQL Database Hyperscale이 가까움) | AlloyDB | 미확인 | 클라우드용으로 저장 구조를 다시 만든 고성능 관계형 DB입니다. |
| DynamoDB | Cosmos DB | Firestore / Bigtable | Cloud DB for MongoDB (성격 다름, 미확인) | 관리형 NoSQL 데이터베이스입니다. |
| ElastiCache | Azure Managed Redis (구 Azure Cache for Redis — Basic·Standard·Premium은 2028-09-30 종료 예정) [10] | Memorystore | Cloud DB for Cache (Valkey·Redis, 구 Cloud DB for Redis) [7] | 관리형 인메모리 캐시입니다. |
| CloudFront | Azure Front Door / Azure CDN | Cloud CDN | Global Edge (CDN+·Global CDN은 2026-12-31 종료 공지) [8] | 콘텐츠 전송 네트워크(CDN)입니다. |
| Route 53 | Azure DNS | Cloud DNS | Global DNS [9] | 관리형 DNS입니다. |
| API Gateway | API Management | Apigee / API Gateway | API Gateway | 관리형 API 게이트웨이입니다. |
| CloudWatch | Azure Monitor | Cloud Monitoring | Cloud Insight [9] | 자원 지표 모니터링과 알림입니다. |
| CloudWatch Logs | Azure Monitor Logs (Log Analytics) | Cloud Logging | Cloud Log Analytics [9] | 로그 수집·검색입니다. |
| ELB (ALB / NLB) | Application Gateway / Load Balancer | Cloud Load Balancing | Load Balancer | 관리형 로드밸런서입니다. |
| SQS | Service Bus / Queue Storage | Pub/Sub / Cloud Tasks | 미확인 | 관리형 메시지 큐입니다. |
| Kinesis / MSK | Event Hubs | Pub/Sub / Managed Service for Apache Kafka | Cloud Data Streaming Service (미확인) | 관리형 스트림(이벤트 스트리밍)입니다. |
| OpenSearch Service | Azure AI Search (성격 다름) | 미확인 | Search Engine Service (미확인) | 관리형 검색 엔진입니다. |
| VPC | Virtual Network (VNet) | VPC | VPC | 클라우드 안의 사설 네트워크입니다. |
| ECR | Container Registry (ACR) | Artifact Registry | Container Registry | 관리형 컨테이너 이미지 저장소입니다. |

## 4. 노드 종류와 사전 연결

기존 50개에 **이미 있는** 노드 종류: DNS, CDN, WAF, 방화벽, L4/L7 로드밸런서, API 게이트웨이, NAT, VPN, WAS, 배스천, 인그레스, 쿠버네티스 서비스(서비스(K8s)), 파드, 함수(서버리스 함수), 캐시, DB 중계, 모니터링, 로깅, CI/CD, 외부 결제(PG).

기존 50개로 **설명되지 않는** 노드 종류와 이번 후보:

| 노드 종류 | 이번 후보 항목 | 비고 |
|---|---|---|
| 웹 클라이언트 | 웹 클라이언트 (2-C) | |
| 모바일 클라이언트 | 모바일 클라이언트 (2-C) | |
| 관리자 | 관리자 (2-C) | |
| 웹 서버 | 웹 서버 (2-C) | 제품: IIS, WebtoB, OHS (기존 Nginx, Apache) |
| 앱 서버 | 앱 서버 (2-C) | 제품: Spring Boot, Node.js, Gunicorn 등 |
| 배치 서버 | 배치 서버 (2-C) | 관련: 배치, 배치 스케줄러, Control-M, Quartz, Airflow |
| 쿠버네티스 클러스터 | 쿠버네티스 클러스터 (2-C) | 기존 "쿠버네티스"는 소프트웨어 설명이라 묶음(클러스터) 설명을 따로 둠. 제품: EKS, OpenShift, Rancher |
| 관리형 서비스 | 관리형 서비스 (2-C) | 3장 대응표와 함께 |
| 관계형 DB | 관계형 DB (2-C) | 제품: MariaDB, MS SQL Server, Tibero, CUBRID, Db2, Aurora, RDS 등 |
| NoSQL DB | NoSQL DB (2-C) | 제품: DynamoDB, Cassandra, HBase (기존 MongoDB) |
| 검색 엔진 | 검색 엔진 (2-C) | 제품: OpenSearch (기존 Elasticsearch) |
| 오브젝트 스토리지 | 오브젝트 스토리지 (2-B) | 기존에는 제품 S3만 있고 종류 설명이 없음 |
| 파일 스토리지 | 파일 스토리지 (2-B) | 관련: NAS, EFS |
| 큐 | 큐 (2-C) | 제품: ActiveMQ, IBM MQ (기존 RabbitMQ, SQS) |
| 스트림 | 스트림 (2-C) | 제품: 기존 Kafka |
| 외부 API | 외부 API (2-C) | |
| 외부 인증 | 외부 인증 (2-C) | 관련: SSO, 기존 OAuth |
| 망연계 솔루션 | **이번 후보에 없음** | 망·보안 조사 몫(망분리와 함께). 그 조사에서 빠지면 사전에 구멍이 남습니다. |

참고: 노드 종류 "함수"는 기존 "서버리스 함수"·"Lambda", "쿠버네티스 서비스"는 기존 "서비스(K8s)"와 이름이 달라 aliases로 이어 주어야 찾아집니다(기존 항목 쪽 aliases 확인 필요).

## 5. 확인 못 한 것 / 판단이 필요한 것

**확인 못 한 것**
- Altibase 오픈소스 여부: 2018년 공개 뒤 2023년 3월 오픈소스 에디션을 중단했다는 내용은 위키백과·DB-Engines(보조 출처)에서만 확인했고 알티베이스 공식 사이트로는 확인하지 못했습니다. definition에는 오픈소스 여부를 적지 않았습니다.
- InfluxDB 3, Nexus Repository, Datadog의 라이선스 세부, WhaTap의 공식 소개 문구: 이번 조사에서 공식 문서로 확인하지 못해 definition에 라이선스를 적지 않았습니다.
- AIX, WebSphere, WebLogic, Db2, IBM MQ, Control-M, Windows Server 2025의 지원 기간: 공식 수명 주기 문서를 열람하지 못했습니다. Windows Server 2016의 연장 지원 종료일(2027-01-12)만 확인했습니다 [26].
- HP-UX: 표준 지원 종료일(2025-12-31)은 언론 보도가 HPE 지원 표를 인용한 것으로 확인했고 [2], 그 뒤의 연장 지원 종료 시점은 확인하지 못했습니다.
- Solaris 11.4: Premier 지원 2031년, Extended 지원 2037년이라는 내용은 언론 보도(보조 출처)로만 확인했습니다 [18]. definition에는 날짜를 넣지 않았습니다.
- uWSGI 유지보수 모드가 시작된 날짜는 출처마다 달라(2022년, 2024년) 적지 않았습니다 [13].
- NCP 대응표의 "미확인" 칸(컨테이너 실행, 큐, 스트림, 검색 등)과 Cloud DB 제품군의 세부.
- TTA 규모산정 지침(TTAK.KO-10.0292/R3, 2023-12 개정)은 원문이 아니라 위키(보조 출처)로 확인했습니다 [16]. tpmC 계산식·보정 계수는 사전에 넣지 않았습니다.
- 금융 SI 용어(채널계·계정계·정보계·대외계, MCI, FEP, EAI)의 뜻은 위키·블로그(보조 출처)로만 확인했습니다 [22]. 표준 문서에 정의된 용어가 아니라 현업 통용어이고, 회사마다 구역을 나누는 방식이 다릅니다.
- EAM의 정식 명칭은 문서마다 Enterprise Access Management와 Extranet Access Management가 섞여 쓰입니다.
- 리포팅 툴의 국내 대표 제품 이름은 확인하지 못해 넣지 않았습니다.
- DR 센터 유형(미러·핫·웜·콜드)과 RTO·RPO는 NIST SP 800-34 Rev.1을 기준 출처로 적었지만 원문을 열람하지 못했고, 복구 소요 시간(몇 시간·며칠·몇 주)은 2차 자료마다 다릅니다. 국내 금융권은 금융당국 규정의 복구 목표 시간을 따르므로 그쪽 확인이 따로 필요합니다(미확인).
- 근거가 "—"인 하드웨어·개념 항목은 통용되는 뜻을 적은 것이며 특정 표준 문서로 대조하지 않았습니다.

**판단이 필요한 것**
1. **지원이 끝났거나 끝나 가는 제품을 넣을지**: CentOS, HP-UX, Solaris는 국내 IDC·공공·금융에 아직 남아 있어 구성도에 나올 가능성이 높습니다. 넣되 definition에 종료 사실을 적는 쪽으로 작성했습니다. 종료일은 시간이 지나면 낡으므로 날짜를 뺀 문구로 줄이는 방안도 있습니다.
2. **특정 업체 제품을 얼마나 넣을지**: 국내 업체 제품(Tibero, Altibase, CUBRID, JEUS, WebtoB, Tmax, Jennifer, WhaTap, Scouter, Pinpoint)은 국내 SI에서 `sw` 값으로 자주 나와 넣었습니다. 반대로 스토리지·네트워크·백업 장비 업체 이름과 리포팅 툴·EAI·MCI·FEP·SSO 제품 이름은 넣지 않고 개념만 넣었습니다. 제품 이름까지 넓힐지 정해야 합니다.
3. **짝 항목을 낱개로 둘지**: RAID 0/1/5/6/10(6개), 미러·핫·웜·콜드 사이트(4개), 풀·증분·차등 백업(3개), 운영계·개발계·검증계·스테이징(4개), 롤링·블루그린·카나리(3개), 채널계·계정계·정보계·대외계(4개)는 낱개로 적었습니다. 사전을 `sw` 값이나 종류 이름으로 찾는다면 낱개가 유리하지만, 화면에서 묶어 보여 주려면 묶음 항목이 낫습니다.
4. **이름이 겹치는 것**: "KVM"(가상화)과 "KVM 스위치"(전환 장치), "PM"(정기점검과 프로젝트 관리자), "Tmax"(TP 모니터 제품과 회사 이름), "API Gateway"(기존 개념 항목과 AWS 제품), "L4"(기존 로드밸런서 항목과 장비 항목). aliases가 서로 부딪치지 않게 정리해야 합니다.
5. **하드웨어 항목의 쓸모**: 구성도 노드는 대부분 논리 구성이라 RAID·UPS·상면 같은 물리 항목이 `sw`나 종류 이름으로 찾아질 일은 적습니다. 사전 검색·본문 링크용으로만 둘지 정해야 합니다.
6. **기존 항목과 뜻이 가까운 것**: "읽기 전용 복제본"(기존 DB 복제), "Active-Active"(기존 Active/Standby), "웹 서버"(기존 WAS의 compare), "오브젝트 스토리지"(기존 S3), "큐·스트림"(기존 SQS·Kafka). 기존 항목의 compare 문장과 말이 어긋나지 않게 맞춰 봐야 합니다.
7. **SSO·EAM**: 요청대로 개념만 적었습니다. 망·보안 조사에서도 SSO를 다루면 중복이 되므로 한쪽으로 모아야 합니다.
8. **클라우드 서비스 이름**: AWS 이름만 항목으로 만들고 Azure·GCP·NCP는 대응표로만 두었습니다. NCP를 실제로 많이 쓴다면 NCP 서비스 이름도 항목(또는 aliases)으로 올리는 것이 좋습니다.

## 6. 출처 목록

열람 수준: **[열람]** 본문을 직접 읽음 / **[검색확인]** 검색 결과 발췌로 확인 / **[주소만]** 알려진 공식 주소만 기재, 이번 조사에서 본문 미열람. (보조)는 위키·블로그·언론입니다.

| 번호 | 제목 | 기관 | URL | 열람 |
|---|---|---|---|---|
| 1 | What to know about CentOS Linux EOL / CentOS Linux end of life, CentOS Stream… | Red Hat | https://www.redhat.com/en/topics/linux/centos-linux-eol , https://www.redhat.com/en/blog/centos-linux-end-life-centos-stream-and-new-red-hat-enterprise-linux-landscape | 검색확인 |
| 2 | The last supported version of HP-UX is no more (보조) / HP-UX Software & Update Information | The Register / HPE | https://www.theregister.com/2026/01/05/hpux_end_of_life/ , https://www.hpe.com/global/softwarereleases/releases-media2/HPEredesign/pages/matrixguide.html | 검색확인 / 주소만 |
| 3 | TmaxTibero 공식 사이트, Tibero 문서 | TmaxTibero | https://www.global.tibero.com/ , https://docs.tibero.com/ | 검색확인 |
| 4 | Altibase (보조) / Altibase System Properties (보조) | 위키백과 / DB-Engines | https://en.wikipedia.org/wiki/Altibase , https://db-engines.com/en/system/Altibase | 검색확인 |
| 5 | IBM closes HashiCorp deal (보조) | The Register | https://www.theregister.com/2025/02/28/ibm_hashicorp_deal_closing/ | 검색확인 |
| 6 | About OpenSearch | OpenSearch Software Foundation (Linux Foundation) | https://opensearch.org/about/ | 검색확인 |
| 7 | Cloud DB for Cache 시작 가이드·릴리스 노트 | 네이버 클라우드 | https://guide.ncloud-docs.com/docs/clouddbforcache-start , https://guide.ncloud-docs.com/docs/en/clouddbforcache-releasenote | 검색확인 |
| 8 | Global Edge 개요 / 공지 "CDN+, Global CDN 서비스 종료 안내 (2026.12.31)" | 네이버 클라우드 | https://guide.ncloud-docs.com/docs/globaledge-overview , https://www.gov-ncloud.com/support/notice/guide | 검색확인(공지 본문 미열람) |
| 9 | 제품 페이지: Ncloud Kubernetes Service, Cloud Functions, Global DNS, NAS, Cloud Insight | 네이버 클라우드 | https://www.ncloud.com/product/containers/nks , https://www.ncloud.com/product/compute/cloudFunctions , https://www.ncloud.com/product/networking/globalDns , https://www.ncloud.com/product/storage/nas , https://www.ncloud.com/product/management/cloudInsight | 검색확인 |
| 10 | What's new in Azure Cache for Redis / 은퇴 안내 블로그 | Microsoft | https://learn.microsoft.com/azure/azure-cache-for-redis/cache-whats-new , https://techcommunity.microsoft.com/blog/azure-managed-redis/-/4458721 | 검색확인 |
| 11 | Cloud Functions is now Cloud Run functions | Google Cloud | https://cloud.google.com/blog/products/serverless/google-cloud-functions-is-now-cloud-run-functions | 검색확인 |
| 12 | VCF 9.1 발표 블로그 | VMware (Broadcom) | https://blogs.vmware.com/cloud-foundation/2026/05/05/scale-simplify-and-secure-your-private-cloud-operations-with-vcf-9-1/ | 검색확인 |
| 13 | The uWSGI project 문서 / Gunicorn 문서 | uWSGI 프로젝트 / Gunicorn 프로젝트 | https://uwsgi-docs.readthedocs.io/en/latest/ , https://docs.gunicorn.org | 검색확인 |
| 14 | Sonar streamlines product naming… | Sonar (SonarSource) | https://www.sonarsource.com/company/press-releases/sonar-streamlines-product-naming-to-reflect-core-mission-of-code-quality-and-security/ | 검색확인 |
| 15 | Debezium joins Commonhaus (보조) / Debezium 저장소 | InfoQ / Debezium | https://www.infoq.com/news/2025/02/debezium-joins-commonhaus , https://github.com/debezium/ | 검색확인 |
| 16 | 정보시스템 용량 산정 (보조) — TTAK.KO-10.0292/R3 "정보시스템 하드웨어 규모산정 지침" 요약 | IT위키 (원 표준: TTA) | https://itwiki.kr/w/정보시스템_용량_산정 | 검색확인(표준 원문 미열람) |
| 17 | We've Closed the Deal — OpenInfra joins Linux Foundation | OpenInfra Foundation | https://openinfra.org/blog/openinfra-joins-linux-foundation | 검색확인 |
| 18 | Oracle extends Solaris 11.4 support (보조) | The Register | https://www.theregister.com/2024/01/29/oracle_extends_solaris_support/ | 검색확인 |
| 19 | JEUS 9 Introduction Guide / JEUS·WebtoB 제품 페이지 | TmaxSoft | https://docs.tmaxsoft.com/en/jeus/9/introduction-guide/chapter-what-is-jeus.html , https://www.tmaxsoft.com/products/jeuswebtob | 검색확인 |
| 20 | CUBRID License | CUBRID | https://cubrid.org/license | 검색확인 |
| 21 | Scouter 저장소 / Pinpoint 저장소 | scouter-project (LG CNS) / pinpoint-apm (NAVER) | https://github.com/scouter-project/scouter , https://github.com/pinpoint-apm/pinpoint | 검색확인 |
| 22 | 은행 계정계 / 시스템 연계 솔루션 / MCI (보조) | IT위키 | https://itwiki.kr/w/은행_계정계 , https://itwiki.kr/w/시스템_연계_솔루션 , https://itwiki.kr/w/MCI | 검색확인 |
| 23 | SP 800-34 Rev.1 Contingency Planning Guide for Federal Information Systems | NIST | https://csrc.nist.gov/publications/detail/sp/800-34/rev-1/final | 주소만 |
| 24 | CNCF Projects (Graduated: containerd, Helm, Istio, Harbor, Argo, Prometheus, Fluentd 등) | CNCF | https://www.cncf.io/projects/ | 열람 |
| 25 | Zabbix License (7.0부터 AGPLv3) | Zabbix | https://www.zabbix.com/license | 검색확인 |
| 26 | Plan for Windows Server 2016 … end of support | Microsoft | https://techcommunity.microsoft.com/t5/windows-it-pro-blog/plan-for-windows-server-2016-and-windows-10-2016-ltsb-end-of/ba-p/4496136 | 검색확인 |
| 27 | WildFly and Red Hat's middleware strategy / JBoss EAP와 WildFly 버전 대응 | WildFly / Red Hat | https://www.wildfly.org/news/2025/03/05/WildFly-and-Red-Hat-s-middleware-strategy/ , https://access.redhat.com/node/21906 | 검색확인 |
| 28 | 제니퍼소프트 공식 사이트 | JenniferSoft | https://jennifersoft.com/ | 검색확인 |
| 29 | Oracle Tuxedo Product Overview | Oracle | https://docs.oracle.com/cd/E53645_01/tuxedo/docs12cr2/overview/overview.html | 검색확인 |
| 30 | Sentry Licensing | Sentry | https://open.sentry.io/licensing | 검색확인 |
| 31 | SP 800-145 The NIST Definition of Cloud Computing | NIST | https://csrc.nist.gov/pubs/sp/800/145/final | 주소만 |
| 32 | SNIA Dictionary (RAID, DAS, NAS, SAN, VTL 등) | SNIA | https://www.snia.org/education/online-dictionary | 주소만 |
| 33 | RFC 9110(HTTP), 8446(TLS), 9293(TCP), 768(UDP), 4251(SSH), 5321(SMTP), 4511(LDAP), 3411(SNMP), 5905(NTP), 7143(iSCSI), 6335(포트 번호) | IETF | https://www.rfc-editor.org/ | 주소만 |
| 34 | AJP Protocol Reference / JDBC 문서 | Apache Tomcat / Oracle | https://tomcat.apache.org/connectors-doc/ajp/ajpv13a.html , https://docs.oracle.com/javase/8/docs/technotes/guides/jdbc/ | 주소만 |
| 35 | AWS 문서 (EC2, EBS, EFS, EKS, ECS, Fargate, RDS, Aurora, DynamoDB, ElastiCache, CloudFront, Route 53, API Gateway, CloudWatch) | AWS | https://docs.aws.amazon.com/ | 주소만 |
| 36 | Azure 문서 | Microsoft | https://learn.microsoft.com/azure/ | 주소만 |
| 37 | Google Cloud 문서 | Google | https://cloud.google.com/docs | 주소만 |
| 38 | 제품 공식 사이트 묶음: Red Hat(RHEL·OpenShift·Ansible), Rocky Linux, Ubuntu, Microsoft(Windows Server·IIS·SQL Server·Hyper-V), IBM(AIX·Db2·WebSphere·IBM MQ·IBM Z), Oracle(WebLogic·OHS·RAC·Data Guard·GoldenGate), MariaDB, Apache(ActiveMQ·Airflow·Cassandra·HBase), Spring Boot, Node.js, PM2, Memcached, InfluxData, BMC(Control-M), Quartz, Docker, KVM, SUSE(Rancher), Jenkins, GitLab, Grafana, Nagios, Elastic, WhaTap, Datadog, Sonatype | 각 제조사·프로젝트 | https://www.redhat.com/ , https://rockylinux.org/ , https://ubuntu.com/server , https://learn.microsoft.com/windows-server/ , https://www.ibm.com/docs/ , https://docs.oracle.com/ , https://mariadb.org/ , https://www.apache.org/ , https://spring.io/projects/spring-boot , https://nodejs.org/ , https://pm2.keymetrics.io/ , https://memcached.org/ , https://www.influxdata.com/ , https://www.bmc.com/it-solutions/control-m.html , https://www.quartz-scheduler.org/ , https://docs.docker.com/ , https://linux-kvm.org/ , https://www.rancher.com/ , https://www.jenkins.io/ , https://about.gitlab.com/ , https://grafana.com/ , https://www.nagios.org/ , https://www.elastic.co/elastic-stack , https://www.whatap.io/ , https://www.datadoghq.com/ , https://www.sonatype.com/products/sonatype-nexus-repository | 주소만 |
| 39 | Kubernetes 문서 (Cluster Architecture, Deployments 롤링 업데이트) | Kubernetes (CNCF) | https://kubernetes.io/docs/concepts/architecture/ , https://kubernetes.io/docs/concepts/workloads/controllers/deployment/ | 주소만 |
| 40 | TPC-C 벤치마크 | TPC | https://www.tpc.org/tpcc/ | 주소만 |
| 41 | EIA/ECA-310-E Cabinets, Racks, Panels, and Associated Equipment (19인치 랙·1U=1.75인치) | EIA/ECA | (표준 문서 — 공개 URL 미확인) | 주소만 |
| 42 | Linux Ethernet Bonding Driver HOWTO / IEEE 802.1AX Link Aggregation | Linux Kernel / IEEE | https://www.kernel.org/doc/Documentation/networking/bonding.txt | 주소만 |
