pipeline {
  agent any
  environment {
    SCANNER_QUBE_HOME = tool 'SonarQubeScanner'
    AWS_CARBON8_IP = credentials('AWS_CARBON8_IP')
    DEV_PATH = '/srv/sites/wp-start-sage-develop.carbon8dev.com'
    STAGING_PATH = '/srv/sites/wp-start-sage.carbon8dev.com' 	
    THEME_ACTIVE = 'sage-theme'
    CURRENT_WORKSPACE = "${env.WORKSPACE}"
    OWNER = "Tools"
    PR_INDEX = env.BRANCH_NAME.replace('PR-', '')
    REPO = "wp-start-sage"
    // Noti for Group
	  // OFFICE_WEBHOOK = credentials('cd87ea84-a11f-4a08-b800-dd002f2fddf4')
    // Noti for tech leads
	  TECH_LEAD_OFFICE_WEBHOOK = credentials('584c84af-6162-4d3e-a364-0e9e29545773')
    GIT_EMAIL_COMMIT = sh(script: "git --no-pager show -s --format='%ae'", returnStdout: true).trim()
  }

  stages {
    stage('Sonarqube Analysis') {
      when {
        anyOf {
          branch 'develop'
          allOf {
            environment name: 'CHANGE_TARGET', value: 'develop'
            branch 'PR-*'
          }
        }
      }
      steps {
        script {
          withSonarQubeEnv("9thWonder SonarQube") {
            sh "${SCANNER_QUBE_HOME}/bin/sonar-scanner"
          }
          def qg = waitForQualityGate()
          if(qg.status != "OK"){
            echo "${qg.status}"
            error "Pipeline aborted due to quality gate coverage failure: ${qualitygate.status}"
          }
        }
      }
    }
  }

  post {
    failure {
      // Noti for Group
      // office365ConnectorSend(webhookUrl: "${OFFICE_WEBHOOK}", color:'#FF0000',  message: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL})", status: 'FAILED')
      // Noti for tech leads
      office365ConnectorSend(webhookUrl: "${TECH_LEAD_OFFICE_WEBHOOK}", color:'#FF0000',  message: "${env.GIT_EMAIL_COMMIT} FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]' (${env.BUILD_URL}) \n Commit: ${env.GIT_COMMIT}", status: 'FAILED')
    }
  }
}