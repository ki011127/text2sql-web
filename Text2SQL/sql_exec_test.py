import sqlite3


# 로그 설정

def test():
    try:
        connection = sqlite3.connect('dataset/AI_HUB/database/publicdata_climate_26/publicdata_climate_26.sqlite')
        cursor = connection.cursor()
        
        # 존재하지 않는 테이블에 대해 잘못된 쿼리 실행
        cursor.execute("SELECT * FROM non_existent_table")
        return 0
    except sqlite3.Error as e:
        # 에러 메시지를 로그 파일에 기록
        print("SQLite error: "+ str(e))
        return e

    finally:
        connection.close()

e = test()
if e:
    print(e)