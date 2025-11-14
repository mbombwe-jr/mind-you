use moodle_api::core::enrol::{get_enrolled_users, unenrol_user_enrolment};
use moodle_client::MoodleClient;
use std::io::{self, Write};

async fn get_user_enrolment_id(
    client: &mut MoodleClient,
    course_id: i64,
    user_id: i64,
) -> anyhow::Result<Option<i64>> {
    let result = get_enrolled_users::call_raw(
        client,
        &mut get_enrolled_users::Params {
            courseid: Some(course_id),
            options: None,
        },
    )
    .await?;

    // Parse the raw response to find the ueid
    if let Some(users) = result.as_array() {
        for user in users {
            if let Some(user_id_field) = user.get("id").and_then(|v| v.as_i64()) {
                if user_id_field == user_id {
                    // Look for enrolment details in the user object
                    if let Some(enrolledcourses) =
                        user.get("enrolledcourses").and_then(|v| v.as_array())
                    {
                        for course in enrolledcourses {
                            if let Some(course_id_field) = course.get("id").and_then(|v| v.as_i64())
                            {
                                if course_id_field == course_id {
                                    // Look for enrolments array within the course
                                    if let Some(enrolments) =
                                        course.get("enrolments").and_then(|v| v.as_array())
                                    {
                                        for enrolment in enrolments {
                                            if let Some(ueid) =
                                                enrolment.get("ueid").and_then(|v| v.as_i64())
                                            {
                                                return Ok(Some(ueid));
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(None)
}

pub async fn run(client: &mut MoodleClient) {
    println!("=== UNENROLL USER FROM COURSE ===");

    // Get course ID
    print!("Enter the course ID: ");
    io::stdout().flush().unwrap();
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let course_id = match input.trim().parse::<i64>() {
        Ok(id) => id,
        Err(_) => {
            println!("Invalid course ID.");
            return;
        }
    };

    // Get user ID
    print!("Enter the user ID: ");
    io::stdout().flush().unwrap();
    input.clear();
    io::stdin().read_line(&mut input).unwrap();
    let user_id = match input.trim().parse::<i64>() {
        Ok(id) => id,
        Err(_) => {
            println!("Invalid user ID.");
            return;
        }
    };

    println!(
        "Looking up enrolment ID for user {} in course {}...",
        user_id, course_id
    );

    match get_user_enrolment_id(client, course_id, user_id).await {
        Ok(Some(ueid)) => {
            println!("Found enrolment ID: {}", ueid);

            let result = unenrol_user_enrolment::call(
                client,
                &mut unenrol_user_enrolment::Params { ueid: Some(ueid) },
            )
            .await;

            match result {
                Ok(response) => {
                    if response.result == Some(true) {
                        println!(
                            "✅ Successfully unenrolled user {} from course {}!",
                            user_id, course_id
                        );
                    } else {
                        println!("❌ Unenrollment failed.");
                        if let Some(errors) = response.errors {
                            for err in errors {
                                println!("Error: {}", err.message.unwrap_or_default());
                            }
                        }
                    }
                }
                Err(e) => {
                    println!("❌ Error unenrolling: {}", e);
                }
            }
        }
        Ok(None) => {
            println!(
                "❌ No enrolment found for user {} in course {}.",
                user_id, course_id
            );
            println!("The user might not be enrolled in this course.");
        }
        Err(e) => {
            println!("❌ Error looking up enrolment: {}", e);
        }
    }
}
