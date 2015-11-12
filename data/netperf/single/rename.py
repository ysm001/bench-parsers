#!/usr/bin/python
# -*- coding: utf-8 -*-
#-------------------------------------------------------------------------------
# Name:     rename.py
#-------------------------------------------------------------------------------

import os
import glob
import sys

TEST_CASE_LIST_DIR = 'test_case_list'

RECV_REPLACE_FILENAME = 'hpg8-1.kern.oss.ntt.co.jp'
SEND_REPLACE_FILENAME = 'hpg8-0.kern.oss.ntt.co.jp'

RENAME_LIST = [
    'hpg8-0_netperf_t_TCP_STREAM_l_60',
    'hpg8-0_netperf_t_UDP_STREAM_l_60_m_18',
    'hpg8-0_netperf_t_UDP_STREAM_l_60_m_82',
    'hpg8-0_netperf_t_UDP_STREAM_l_60_m_210',
    'hpg8-0_netperf_t_UDP_STREAM_l_60_m_466',
    'hpg8-0_netperf_t_UDP_STREAM_l_60_m_978',
    'hpg8-0_netperf_t_UDP_STREAM_l_60_m_1472',
    'hpg8-0_netperf_t_TCP_RR_l_60',
    'hpg8-0_netperf_t_UDP_RR_l_60',
]

""" ディレクトリ名の一覧を取得 """
def getdirs(path):
    dirs=[]

    for item in os.listdir(path):
        if os.path.isdir(os.path.join(path, item)):
            dirs.append(item)
    return dirs

""" main """
def main():

    print "★処理を開始します"

    # TEST CASE リスト
    test_case_dir_lists = []

    for test_case_dir_list in getdirs('./'):
        test_case_dir_lists.append(test_case_dir_list)

    print "★ test_case_dir_lists ",test_case_dir_lists,"を検出"

    # TEST CASE 分回す
    for i in range(len(test_case_dir_lists)):

        # <TEST CASE> 配下の試験結果リスト
        test_result_dir_lists = []

        for test_result_dir_list in getdirs(test_case_dir_lists[i]):
            test_result_dir_lists.append(test_result_dir_list)

        print "★★ test_case_dir_lists[i] ",test_case_dir_lists[i],"：test_result_dir_lists ",test_result_dir_lists,"を検出"

        # 試験結果リスト分回す
        for j in range(len(test_result_dir_lists)):

            # receiver_get_resources

            #target_dir_path = './' + test_case_dir_lists[i] + '/' + test_result_dir_lists[j]
            #target_tar_bz2_file = target_dir_path + '/' + 'receiver_get_resources/*resrc*.tar.bz2'

            #print "★★★ target_dir_path ：",target_dir_path,"/receiver_get_resources を処理"
            
            # j 番目の試験結果のディレクトリ配下の *.tar.bz2 をリスト化
            # 対象ファイル：{ホスト名}_netperf_*_resrc_{yyyymmdd}-{hhmmss}
            #tarbz2_lists = glob.glob(target_tar_bz2_file)

            # ソート
            #sorted(tarbz2_lists)

            #if len(tarbz2_lists) != 9:
            #    sys.stderr.write("★★" + target_dir_path + "配下 (receiver_get_resources) の tarbz2_lists の数" + str(len(tarbz2_lists)) + "がおかしいです。\n")
            #    continue            

            #for k,tarbz2_list in enumerate(tarbz2_lists):
            #    tarbz2_filename = os.path.basename(tarbz2_list)
            #    # print "★★★",target_dir_path,":",tarbz2_filename,"を検出"

            #    tarbz2_rename = tarbz2_filename.replace(RECV_REPLACE_FILENAME, RENAME_LIST[k])
            #    print "★★★",target_dir_path,":",tarbz2_filename,"->",tarbz2_rename,"にリネーム"

            #    os.rename(target_dir_path + '/receiver_get_resources/' + tarbz2_filename, \
            #              target_dir_path + '/receiver_get_resources/' + tarbz2_rename)        

            # 初期化
            #for k,tarbz2_list in enumerate(tarbz2_lists):
            #    tarbz2_list[k] = ""

            # sender_get_resources

            target_dir_path = './' + test_case_dir_lists[i] + '/' + test_result_dir_lists[j]
            target_tar_bz2_file = target_dir_path + '/' + 'sender_get_resources/*resrc*.tar.bz2'

            print "★★★ target_dir_path ：",target_dir_path,"/sender_get_resources を処理"
           
            # j 番目の試験結果のディレクトリ配下の *.tar.bz2 をリスト化
            # 対象ファイル：{ホスト名}_netperf_*_resrc_{yyyymmdd}-{hhmmss}
            tarbz2_lists = glob.glob(target_tar_bz2_file)

            # ソート
            sorted(tarbz2_lists)

            if len(tarbz2_lists) != 9:
                sys.stderr.write("★★" + target_dir_path + "配下 (sender_get_resources) の tarbz2_lists の数" + str(len(tarbz2_lists)) + "がおかしいです。\n")
                continue            

            for k,tarbz2_list in enumerate(tarbz2_lists):
                tarbz2_filename = os.path.basename(tarbz2_list)
                # print "★★★",target_dir_path,":",tarbz2_filename,"を検出"

                tarbz2_rename = tarbz2_filename.replace(SEND_REPLACE_FILENAME, RENAME_LIST[k])
                print "★★★",target_dir_path,":",tarbz2_filename,"->",tarbz2_rename,"にリネーム"

                os.rename(target_dir_path + '/sender_get_resources/' + tarbz2_filename, \
                          target_dir_path + '/sender_get_resources/' + tarbz2_rename)        

if __name__ == '__main__':
    main()
